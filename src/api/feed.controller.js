import Promise from 'bluebird';
import { Feed } from '../models/feed';
import { Post } from '../models/post'
import { UserFeed } from '../models/userFeed'
import { UserPost } from '../models/userPost'
import { swallow } from '../utils/decorators';
import validator from 'validator';
import _ from 'lodash';
import FeedParser from 'feedparser'
import request from 'request'
import fetchFavicon from 'favicon-getter'

export default class FeedController {
  @swallow
  static async getFeed(req, res, next) {
    //const feed = await Feed.findByIdAsync(req.params.feed_id);
    const feed_id = req.params.feed_id;
    const user_id = req.user._id;

    let count = 0
    let readcount = 0
    let result
    await Promise.all([
      Post.find({
        feed_id,
      }).count(),
      UserPost.find({
        feed_id,
        read: true,
        user_id
      }).count()]).then(res => {
        [count, readcount] = res
      })

    await UserFeed.findOne({
      user_id,
      feed_id,
    }, {
      user_id: 0,
    }).populate('feed_id').lean().exec((err, data) => {
      if (data != null) {
        data = {
          ...data.feed_id,
          ...data,
          _id: data.feed_id._id,
          //feed_id: data.feed_id[0]._id,
          unread:  count - readcount,
          count: count,
          is_subscribe : 'true'
        }
      } 
      return result = data
    })

    if (result && result._id) {
      res.json({success: true, data: result});
    } else {
      await Feed.findOne({
        _id: feed_id,
      }).lean().exec((err, data) => result = {
        ...data,
        unread: count - readcount,
        count: count,
        is_subscribe : 'false'
      })
      if (result && result._id) {
        res.json({success: true, data: result});
      } else {
        res.status(422).send({success: false, error_msg: '订阅源不存在'});
      }
    }
  }

  @swallow
  static async addFeed(req, res, next) {
    const feedlink = validator.trim(req.body.feedlink);

    if(!validator.isURL(feedlink)) {
      let error = 'URL 不合法';
      return res.status(422).send({success: false, error_msg: error});
    }

    const feedparser = new FeedParser()
    //查询数据库是否存在该订阅源
    let return_result = await Feed.findOneAsync({absurl:feedlink});
    if (return_result && return_result._id) {
      return res.send({success: true, data:return_result._id});
    }

    let req_feed = request({
          url:     feedlink,
          headers: {
            'User-Agent': 'request',
          },
          timeout: 5000,
        });
    req_feed.on('error', error => {
      // handle any request errors
      global.logger.debug(error, 'request feedlink error');
    });

    req_feed.on('response', result => {
      let stream = this;
      if (result.statusCode !== 200) {
        this.emit('error', new Error(`错误状态码: ${res.statusCode}`));
      } else {
        result.pipe(feedparser);
      }
    })

    feedparser.on('error', function (error) {
      global.logger.debug(error, 'feedparser error');
    });

    feedparser.on('meta', async function () {
      let favicon = null
      await fetchFavicon(this.meta.link).then(data => favicon = data).catch(e => e);

      const data = {
        absurl: feedlink,
        favicon,
      }

      const feed = new Feed({
        ...this.meta,
        ...data
      })
      const store = await feed.save()
      const feedid = store._id
      const link = store.link
      feedparser.on('readable', () => {
        // eslint-disable-next-line
        while (return_result = this.read()) {
          const post = new Post({
            ...return_result,
            feed_id: feedid,
            website: link,
          })
          post.save()
        }
      })

      feedparser.on('end', () => {
        return res.send({success: true, data:feedid});
      })

    })
  }

  /**
 * 订阅订阅源
 * @method: put
 * @link:   /feed/{id}
 */
  @swallow
  static async subscribe(req, res, next) {
    const feed_id = req.params.feed_id;
    const user_id = req.user._id;

    const result = await Feed.findByIdAsync(feed_id);

    if (result && result._id) {
      // 判断当前用户有没有订阅
      const userresult = await UserFeed.findOneAsync({
        user_id,
        feed_id: feed_id,
      })
      if (userresult && userresult._id) {
        res.status(422).send({success: false, data: `已订阅源 ${result.title}(${result.id})`})
      }else{
        result.feedNum += 1
        result.save()

        let count = 0
        let readcount = 0
        await Promise.all([
          Post.find({
            feed_id,
          }).count(),
          UserPost.find({
            feed_id,
          }).count()]).then(res => {
            [count, readcount] = res
          })

        const userfeed = new UserFeed({
          feed_id,
          user_id,
          unread: count - readcount,
        })
        userfeed.save()
        res.json({success: true, data: result});
      }

    }else{
      res.status(422).send({success: false, error_msg: '不存在该订阅源,请尝试搜索'});
    }
  }


  @swallow
  static async getMyFeeds(req, res, next) {
    const user_id = req.user._id;
    let items
    await UserFeed.find({
      user_id,
    }, {
      user_id: 0,
    })
    .populate('feed_id', {
      favicon: 1,
      title:   1,
    }).lean().exec((err, data) => items = data.map(item => ({
      ...item.feed_id,
      ...item,
      feed_title: item.feed_id.title,
      _id:        item.feed_id._id,
    })))

    await Promise.all(items.map(item => new Promise(async resolve => {
      let readcount
      let count
      await Promise.all([
        UserPost.count({
          feed_id: item.feed_id,
          read:    true,
          user_id,
        }),
        Post.count({
          feed_id: item.feed_id,
        }),
      ]).then(res => {
        [readcount, count] = res
      })

      resolve({
        ...item,
        unread: count - readcount,
      })
    }))).then(result => {
      res.json({success: true, data: result});
    })

  }

  @swallow
  static async unsubscribe(req, res, next) {
    const feed_id = req.params.feed_id;
    const user_id = req.user._id;
    const result = await UserFeed.find({
      user_id,
      feed_id,
    }).remove()

    if (result.result.n === 0) {
      res.status(422).send({success: false, error_msg: '你没有订阅该订阅源'});
    } else {
      await Feed.update({_id: feed_id},{$inc: {feedNum: -1}}).exec();
      return res.json({success: true, data: '取消订阅成功'});
    }
  }

/**
 * 获取特定订阅源
 * @method: get
 * @link:   /feeds
 * @param:  order
 * @param:  desc
 * @param:  limit
 * @param:  page
 * @param:  per_page
 * @date: 2017.1.10
 */
  @swallow
  static async getFeeds(req, res, next) {
    const user_id = req.user._id;
    const { order, limit, page, desc } = req.query
    let query = {active: true};
    const result = await Feed.paginate(query, {
      page: parseInt(page, 10) || 1,
      limit: Number(limit) || 10,
      sort: {
        // top: -1,
        // score: -1,
         [order]: desc === 'true' ? '1' : '-1',
         created_at: -1
      }
    })

    let items = result.docs
    await Promise.all(items.map(item => new Promise(async resolve => {
      let readcount
      let count
      let state = await UserFeed.findOne({
        user_id,
        feed_id: item._id,
      })
      if (state && state._id) {
        resolve({
          ...item._doc,
          is_subscribe: 'true',
        })
      }else{
        resolve({
          ...item._doc,
          is_subscribe: 'false',
        })
      }
    }))).then(feedsdata => {
      res.json({success: true, data: feedsdata, count: result.pages});
    })

    // res.json({
    //   data: result.docs,
    //   count: result.pages
    // });
  }



/**
 * 定时更新订阅源
 */
  static async cronFetchPosts() {
    const items = await Feed.find({}, {
      absurl: 1,
      _id:    1,
    })

    const starttime = Date.now()
    let updateCount = 0
    let newCount = 0
    let equalCount = 0

    const promises = items.map(item => new Promise(resolve => {
      const req = request({
        url:     item.absurl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36',
        },
        timeout: 10000,
      })
      const feedparser = new FeedParser()
      Feed.update({
        _id: item._id,
      }, {
        updated_at: Date.now(),
      })
      req.on('response', res => {
        if (res.statusCode !== 200) {
          console.log(`#1 ${res.statusCode} -- ${item.absurl}`)
          resolve()
        } else {
          res.pipe(feedparser)
          feedparser.on('error', err => {
            console.log(`#2 ${err} -- ${item.absurl}`)
            resolve()
          })
        }
      })
      req.on('error', err => {
        console.log(`#3 ${err} -- ${item.absurl}`)
        resolve()
      })
      feedparser.on('readable', async function () {
        let result
        // eslint-disable-next-line
        while (result = this.read()) {
          // Use guid to identify...
          const origin = await Post.findOne({
            guid:    result.guid,
            feed_id: item._id,
          })
          if (origin && origin._id) {
            if (origin.link && (origin.link.toString() === result.link.toString())) {
              equalCount++
            } else {
              Object.assign(origin, result)
              origin.save()
              updateCount++
            }
          } else {
            // TODO: Invalid Date Cast failed
            if (Object.prototype.toString.call(result.pubdate) !== '[object Date]') {
              result.pubdate = null
            }
            if (Object.prototype.toString.call(result.date) !== '[object Date]') {
              result.date = null
            }
            const post = new Post(Object.assign(result, {
              feed_id: item._id,
            }))
            newCount++
            post.save()
            UserFeed.update({
              feed_id: item._id,
            }, {
              $inc: {
                unread: 1,
              },
            })
          }
        }
      })
      feedparser.on('end', () => {
        resolve()
      })
    }))
    Promise.all(promises).then(() => {
      setTimeout(() => {
        console.log('\r\n************* OK *************')
        console.log(Date().toLocaleString())
        console.log(`FeedNum: ${items.length}`)
        console.log(`TimeUsed: ${(Date.now() - starttime) / 1000} s`)
        console.log(`Equal: ${equalCount}`)
        console.log(`Update: ${updateCount}`)
        console.log(`New: ${newCount}`)
        console.log('************* OK *************\r\n')
      }, 100)
    }).catch(err => {
      console.log(err)
    })


  }
}
