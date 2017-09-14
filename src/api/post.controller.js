import Promise from 'bluebird';
import { Feed } from '../models/feed';
import { Post } from '../models/post'
import { UserFeed } from '../models/userFeed'
import { UserPost } from '../models/userPost'
import { swallow } from '../utils/decorators';
import validator from 'validator';
import _ from 'underscore';

export default class PostController {
  /**
 * 获取一篇文章的详细信息
 */
  @swallow
  static async getPost(req, res, next) {
    const post_id = req.params.post_id;
    const user_id = req.user._id;
    let result
    let readresult
    await Promise.all([
      Post.findOne({
        _id: post_id,
      }, {
        summary: 0,
        guid:    0,
      }).populate('feed_id', {
        favicon: 1,
        _id:     1,
        link:    1,
      }).lean().exec(),
      UserPost.findOne({
        post_id: post_id,
        user_id,
      }).lean().exec(),
    ]).then(res => {
      [result, readresult] = res
      result = {
        ...result,
        feed_id: result.feed_id._id,
        favicon: result.feed_id.favicon,
        website: result.feed_id.link,
        read:    !!readresult && readresult.read === true,
        love:    !!readresult && readresult.love === true,
        mark:    !!readresult && readresult.mark === true,
      }
    })

    if (result && result._id) {
      let posts = []
      let readposts = []
      await Promise.all([
        Post.find({
          feed_id: result.feed_id,
        }).sort({
          pubdate: -1,
        }).lean().exec((err, data) => posts = data.map(item => {
          item._id = item._id.toString()
          return item
        })),
        UserPost.find({
          user_id,
          feed_id: result.feed_id,
          read:    true,
        }, {
          _id:     0,
          post_id: 1,
        }).sort({
          pubdate: -1,
        }).lean().exec((err, data) => {
          readposts = _.invoke(_.flatten(_.pluck(data, 'post_id')), 'toString')
        }),
      ])
      const prePost = posts[_.pluck(posts, '_id').indexOf(post_id) - 1] && posts[_.pluck(posts, '_id').indexOf(post_id) - 1]._id
      const nextPost = posts[_.pluck(posts, '_id').indexOf(post_id) + 1] && posts[_.pluck(posts, '_id').indexOf(post_id) + 1]._id
      // 全部文章 ID 中遍历找出一个不等于所要查找 ID 且不在 readposts 中的第一个 ID
      const nextunread = _.findWhere(posts, {
        _id: _.find(_.pluck(posts, '_id'), post => post !== post_id && !readposts.includes(post)),
      })
      let return_data = {
        success: true,
        data:    {
          ...result,
          pre:        prePost,
          next:       nextPost,
          nextunread: nextunread && {
            feed_id:     nextunread.feed_id,
            _id:         nextunread._id,
            title:       nextunread.title,
            description: nextunread.description && nextunread.description.replace(/<[^>]+>/g, '').slice(0, 400),
            pubdate:     nextunread.pubdate,
          },
        }
      }
      res.json({success: true, data: return_data});
    } else {
      res.status(422).send({success: false, error_msg: '找不到指定文章'});
    }
  }


 /**
 * 更新文章状态
 * @method: put
 * @link:   /posts/{post_id}
 * @param:  {string} type [read|mark|love|finish]
 * @param:  {boolean} revert [true|false]
 */
  @swallow
  static async updatePost(req, res, next) {
    const post_id = req.params.post_id;
    const user_id = req.user._id;
    const type = req.body.type && req.body.type.trim();
    const revert = req.body.revert === true
    if (!['read', 'mark', 'love', 'finish'].includes(type)) {
      res.status(422).send({success: false, error_msg: '无效的参数'});
    } else {
      let state
      let post
      await Promise.all([
        UserPost.findOne({
          user_id,
          post_id,
        }),
        Post.findById(post_id),
      ]).then(result => {
        [state, post] = result
      }).catch(e => e)
      if (!(post && post._id)) {
        res.status(422).send({success: false, error_msg: '没有找到指定的文章'});
      }
      let basic = {
        user_id,
        feed_id: post.feed_id,
        post_id,
      }
      if (state && state._id) {
        state[type] = revert ? !state[type] : true
        if (!revert) { state[`${type}_date`] = Date.now() }
        state.save()
      } else {
        basic[type] = true
        basic[`${type}_date`] = Date.now()
        basic = new UserPost(basic)
        basic.save()
      }
      res.json({success: true, post_id: post_id});
    }

  }


/**
 * 获取当前用户的全部 ** 文章
 * @method: get
 * @link:   /posts
 * @param:  type [mark|unread]
 * @param:  feed_id
 */
  @swallow
  static async getPosts(req, res, next) {
    // ps: mark过的就一定的read过的； 但read过的不一定mark过的
    const user_id = req.user._id;
    let { type, feed_id, page_num, per_page} = req.query

    let result
    let query;
    let sort;
    // global.logger.debug('per_page:'+JSON.stringify(per_page));
    // global.logger.debug('page_num:'+JSON.stringify(page_num));
    if(type){
      if(type == 'mark'){
        query = {mark:true, user_id}
        sort = { mark_date: -1 }
      }else if(type == 'read'){
        query = {read:true, user_id}
        sort = { read_date: -1 }
      }
    }
    if (['mark', 'read'].includes(type)) {
      page_num = parseInt(page_num, 10) || 0;
      per_page = Number(per_page) || 10;
      await UserPost.find(query)
        .populate('feed_id')
        .populate('post_id')
        .sort(sort)
        // .skip(+page * +limit)
        // .limit(+limit)
         .lean()
        .exec((err, items) => {

          result = items.map((item) => {
            const tmp = {};
            tmp.mark = item.mark
            tmp.love = item.love
            tmp._id = item.post_id._id
            tmp.title = item.post_id.title
            tmp.feed_id = item.feed_id._id
            tmp.feed_title = item.feed_id.title
            tmp.favicon = item.feed_id.favicon
            tmp.pubdate = item.feed_id.pubdate
            tmp.link = item.post_id.link

            tmp.summary = item.post_id.description && item.post_id.description.replace(/<[^>]+>/g, '').slice(0, 150)
            tmp.description = item.post_id.description && item.post_id.description.match(/<img\s+src="(.*?)"/)
            if (tmp.description) {
              if (tmp.description[1].slice(0, 2) !== '//' && tmp.description[1].slice(0, 2) !== 'ht') {
                tmp.description = item.post_id.website + tmp.description[1]
              } else {
                tmp.description = tmp.description[1]
              }
            } else {
              tmp.description = 'https://assets.lambda-study.com/lambda-user.png?imageslim&imageMogr2/thumbnail/400x220!'
            }
            return tmp
          })
        })
        .catch(e => e)
      res.json({success: true, data: result});
    } else if (feed_id !== undefined) {
      // const ObjectId = require('mongoose').Types.ObjectId;
      // feed_id = new ObjectId(feed_id);
      let postsFind;
       // global.logger.debug('limit:'+JSON.stringify(limit));
      // if( limit && limit != 10){
      //   postsFind = Post.find({
      //     feed_id,
      //   }, {
      //     description: 0,
      //     summary:     0,
      //   })
      //   .sort({
      //     pubdate: -1,
      //     _id:     -1,
      //   })
      //   .skip(+page * +limit)
      //   .limit(+limit)
      //   .lean()
      //   .exec()
      // }else{
        postsFind = Post.find({
          feed_id,
        }, {

        })
        .sort({
          pubdate: -1,
          _id:     -1,
        })
        .lean()
        .exec()
      // }
      

      await Promise.all([
        postsFind,
        UserPost.find({
          feed_id,
          user_id,
        }, {
          user_id: 0,
          feed_id: 0,
        }).lean()
        .exec(),
      ]).then(items => {
        result = items[0].map((item) =>  {

          item.summary = item.description && item.description.replace(/<[^>]+>/g, '').slice(0, 150)
          item.description = item.description && item.description.match(/<img\s+src="(.*?)"/)
          if (item.description) {
            if (item.description[1].slice(0, 2) !== '//' && item.description[1].slice(0, 2) !== 'ht') {
              item.description = item.website + item.description[1]
            } else {
              item.description = item.description[1]
            }
          } else {
            item.description = 'https://assets.lambda-study.com/lambda-user.png?imageslim&imageMogr2/thumbnail/400x220!'
          }
          return {
            ...items[1].filter(userpost => userpost.post_id.toString() === item._id.toString())[0],
            ...item,
            post_id: item._id,
          }

        })

        res.json({success: true, data: result});
      })
    } else {
      res.status(422).send({success: false, error_msg: '不支持的查询'});
    }
  }


/**
 * 更新全部未读文章
 * @method: put
 * @link:   /posts
 * @param:  {string} feed_id
 */
  @swallow
  static async updatePosts(req, res, next) {
    const user_id = req.user._id;
    const ids = req.body.feed_id.split(',');
    ids.forEach(async id => {
      let posts = await Post.find({
        feed_id: id,
      }).sort('date')
      posts = posts.map(value => value._id)
      posts.forEach(async post => {
        let state = await UserPost.findOne({
          user_id,
          post_id: post,
        })
        if (state && state._id) {
          if (!state.read) {
            state.read = true
            state.save()
          }
        } else {
          state = new UserPost({
            user_id,
            feed_id:   id,
            post_id:   post,
            read:      true,
            read_date: Date.now(),
          })
          state.save()
        }
      })
    })
    res.json({success: true, data: '更新成功'});
  }

/**
 * 最近更新的未读的文章
 * @method: get
 * @link:   /posts/recent
 */
  @swallow
  static async main(req, res, next) {
    let { page, limit} = req.query
    page = parseInt(page, 10) || 1;
    limit = Number(limit) || 10;
    const user_id = req.user._id;
    let items
    let userposts
    let readlist
    const unreadposts = []
    let unreadpostids = []
    const counts = []

      // 查询用户订阅源
    await UserFeed.find({
      user_id,
    }, {
      user_id: 0,
    })
    .populate('feed_id', {
      favicon: 1,
      title:   1,
    }).lean().exec((err, data) => {
      items = data.map(item => {
        item.feed_title = item.feed_id.title
        item.favicon = item.feed_id.favicon
        item.feed_id = item.feed_id._id
        return item
      })
    })

    //用户已读的文章
    await UserPost.find({
      feed_id: { $in: _.pluck(items, 'feed_id') },
      read:    true,
      user_id,
    }, {
      feed_id: 1,
      post_id: 1,
    }).lean().exec((err, rows) => {
      userposts = rows.map(row => {
        row.feed_id = row.feed_id.toString()
        row.post_id = row.post_id.toString()
        return row
      })
      readlist = _.pluck(userposts, 'post_id')
      userposts = _.groupBy(userposts, 'feed_id')
      items.forEach(item => {
        if (userposts[item.feed_id.toString()] === undefined) {
          userposts[item.feed_id.toString()] = []
        }
      })
    })

    //未读的文章
    await Post.find({
      //feed_id: { $in: Object.keys(userposts) },
      feed_id: { $in: _.pluck(items, 'feed_id') },
      //post_id: { $nin: readlist },
    }, {
      feed_id: 1,
      _id:     1,
    }).sort({pubdate: -1}).lean().exec((err, posts) => {
      posts.forEach(post => post.feed_id = post.feed_id.toString())
      posts = _.groupBy(posts, 'feed_id')
      //currentFeedPosts表示某个feed的所有post
      posts = _.mapObject(posts, (currentFeedPosts, currentFeedId) => {
        //未读的数量
        counts[currentFeedId] = currentFeedPosts.length - userposts[currentFeedId].length
        //已读的postid
        const read_ids = userposts[currentFeedId].length === 0 ? [] : _.pluck(userposts[currentFeedId], 'post_id')
        // 获取第一篇未读文章{post_id, feed_id}
         const post = currentFeedPosts.find(p => read_ids.indexOf(p._id.toString()) === -1)
         if (post) unreadposts.push(post._id.toString())
        //let inter_posts = currentFeedPosts.filter(p => read_ids.indexOf(p._id.toString()) === -1)

       // inter_posts = inter_posts.slice(0,5);
        //inter_posts.forEach(post => unreadposts.unshift(post._id.toString()))
        //inter_posts.forEach(post => unreadposts.unshift(post))

        //现在未读的文章都已经在unreadposts里面了
      })
    })

    //对unreadposts进行时间排序后再分页  sortBy  slice

    //returnbnbs.slice((page - 1) * limit,(page - 1) * limit+limit);
  //  _.sortBy(unreadposts, 'pubdate');
    //unreadposts.forEach(post => unreadpostids.unshift(post._id.toString()))
    //unreadpostids = unreadpostids.slice((page - 1) * limit, (page - 1) * limit+limit);

    //按时间进行排序然后分页
    //global.logger.debug('userposts:'+JSON.stringify(userposts));
   // global.logger.debug('unreadpostids:'+JSON.stringify(unreadpostids));
    const data = []
    // 获取未读文章详细
    await Post.find({
      _id: { $in: unreadposts },
    }).lean().exec((err, posts) => {
      for (const post of posts) {
        if (post) {
          post.summary = post.description && post.description.replace(/<[^>]+>/g, '').slice(0, 100)
          post.description = post.description && post.description.match(/<img\s+src="(.*?)"/)
          if (post.description) {
            if (post.description[1].slice(0, 2) !== '//' && post.description[1].slice(0, 2) !== 'ht') {
              post.description = post.website + post.description[1]
            } else {
              post.description = post.description[1]
            }
          } else {
            post.description = 'https://assets.lambda-study.com/lambda-user.png?imageslim&imageMogr2/thumbnail/400x220!'
          }
          data.unshift({
            ...post,
            ...items.find(item => item.feed_id.toString() === post.feed_id.toString()),
            _id:    post._id,
            unread: counts[post.feed_id.toString()],
          })
        }
      }
    })
    res.json({success: true, data: data});
  }
}