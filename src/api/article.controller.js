import Promise from 'bluebird';
import { Topic } from '../models/topic';
import { Comment } from '../models/comment';
import { Article, Scores } from '../models/article';
import { User, Values } from '../models/user';
import { swallow } from '../utils/decorators';
import cache from '../utils/cache';
import tools from '../utils/tools';
import mail from '../utils/email';
import message from '../utils/message';
import config from '../config/env';
import validator from 'validator';
import _ from 'lodash';
import MarkdownIt from 'markdown-it';
const ObjectId = require('mongoose').Types.ObjectId;

export default class ArticleController {
  @swallow
  static async postArticles(req, res, next){
    const title = validator.trim(req.body.title);

    let error_msg;
    if (!title) {
      error_msg = '标题不能为空.';
    }
    if (error_msg) {
      return res.status(422).send({success: false, error_msg: error_msg});
    }

    req.body.title = title;
    req.body.authorId = req.user._id;

    // 将图片提取存入images,缩略图调用
    //req.body.images = tools.extractImage(req.body.description);

    const article = await Article.createAsync(req.body);
    //const articles = [article._id];
    //await Promise.map(articles, (article) => {return article.saveAsync();});

    //cache.del(`articles:latest:1`);  // 新发布一篇文章会影响最新动态
    //cache.del(`topic:${req.body.topicId}:articles:${req.body.type}:1`)

    //发邮件给admin进行审核
    if(req.body.from == 'share'){
      mail.sendAuditMail(req.user.name, title);
    }
    
    return res.status(200).json({success: true, data: article , article_id: article._id});
  }

  static async getTopicArticles(req, res, next) {
    const page = parseInt(req.query.page, 10) || 1;
    const topicId = req.params.topic_id;
    let condition = {
      topicId: req.params.topic_id,
      active: true,
      type: req.query.type,
    }

    if(req.query.tag_id){
      //tagId = new mongoose.Types.ObjectId(tagId);

      const tag_id = String(req.query.tag_id);
      // condition = _.defaults({ condition, tags: { $elemMatch: { $eq:tag_id } } });
      condition = { condition, tags: { $elemMatch: { $eq:tag_id } } };
    }

    let result = await cache.get(`topic:${topicId}:articles:${req.query.type}:${page}`);
    if ( !result ) {
      result = await Article.paginate(condition, {
        populate: [
          {path: 'authorId', model: 'User', select: '_id name description headimgurl'},
        ],
        page: page,
        limit: Number(req.query.limit) || 10,
        sort: {
          top: -1,
          score: -1,
          created_at: -1,
        },
      });
      if (page === 1) {
        cache.set(`topic:${topicId}:articles:${req.query.type}:${page}`, result);
      }
    }
    
    res.json({
      success: true,
      data: {
        pageCount: result.pages,
        articles: result.docs,
      },
    });
  }

  @swallow
  static async putCollect(req, res, next) {
    const user = req.user;
    const article = await Article.findByIdAndUpdateAsync(req.params.article_id, {$inc: {collectCount: 1, score: Scores.collect, weekScore:Scores.collect, monthScore:Scores.collect}});
    article.collects.addToSet(user);
    await article.saveAsync();

    await User.update(
      {_id: user._id},
      {
        $addToSet: {collectedArticles: {$each: [article], $position: 0,}},
        $inc: {score: Values.collect},
      }).exec();
    message.sendMessage(article.authorId, user._id, article._id, 'article', 'collect');
    return res.json({success: true, data: article._id, isCollected: true});
  }

  @swallow
  static async deCollect(req, res, next) {
    const article = await Article.findByIdAndUpdateAsync(req.params.article_id, {$pull: {collects: req.user._id}, $inc: {collectCount: -1, score: -Scores.collect, weekScore:-Scores.collect, monthScore:-Scores.collect}});

    await User.update(
      {_id: req.user._id},
      {
        $pull: {collectedArticles: req.params.article_id},
        $inc: {score: -Values.collect},
      }).exec();
    message.deleteMessage(req.user._id, req.params.article_id, 'article', 'collect');
    return res.json({success: true, data: 'decollected', isCollected: false});
  }


  @swallow
  static async putTop(req, res, next) {
    await Article.updateAsync({_id: req.params.article_id}, { $set: { top: true } }, { multi: true });
    cache.del('articles:top:1');
    return res.json({success: true, data: 'toped'});
  }

  @swallow
  static async getArticle(req, res, next) {
     //let article = await cache.get(`article:${req.params.article_id}`);
    let article ;
    const md = new MarkdownIt({
      html:true,  // 启用html标记转换
    });
    //if ( !article ) {
      article = await Article.findByIdAndUpdate(req.params.article_id, {$inc: {visitCount: 1, score: Scores.visit, weekScore:Scores.visit, monthScore:Scores.visit }}).populate([
        {path: 'authorId', model: 'User', select: '_id name description headimgurl'},
        {path: 'topicId', model: 'Topic', select: '_id title sns price'},
        {path: 'tags', model: 'Tag', select: '_id name'},
      ]).exec();
      //cache.set(`article:${req.params.article_id}`, article);
   // }

    // 要判断用户是否收藏了这个article
    // if(req.query.user_id){
    //   const user = await User.findOneAsync({_id: req.query.user_id, collectedArticles: {$all: [req.params.article_id]}});
    //   article.isCollected = user ? true : false;
    // }

    // description markdown文档转成HTML
    if(article){
      if(req.query.from == 'front' && article.description){
        article.description = md.render(article.description);
      }
      return res.json({success: true, data: article});
    }else{
      return res.json({success: false, data: {}});
    }
    

    
  }

  @swallow 
  static async updateArticle(req, res, next) {
    const title = validator.escape(validator.trim(req.body.title));

    let error_msg;
    if (!title) {
      error_msg = '标题不能为空.';
    }
    if (error_msg) {
      return res.status(422).send({success: false, error_msg: error_msg});
    }

    // 将图片提取存入images,缩略图调用
    // article.imgs = tools.extractImage(req.body.description);

    req.body.title = title;
    const article = await Article.findByIdAndUpdateAsync(req.params.article_id, req.body, {new:true});

    //await cache.set(`article:${req.params.article_id}`, article);
    return res.json({success: true, article_id: article._id});
  }

  @swallow
  static async deleteArticle(req, res, next) {
    let article = await Article.findByIdAsync(req.params.article_id);
    

    article.active = !article.active;
    article = await article.saveAsync();
    const articles = [article._id];

    let pushCondition;
    let incCondition;
    if(article.type === 'video'){
      pushCondition = { videos: { $each: articles, $position: 0, }};
      incCondition = {score: Values.video}
    }else if(article.type === 'doc'){
      pushCondition =  { docs: { $each: articles, $position: 0, }};
      incCondition = {score: Values.article, articleCount: 1};
    }else if(article.type === 'book'){
      pushCondition = { books: { $each: articles, $position: 0, }};
      incCondition = {score: Values.book}
    }

    if(article.active){
      if(article.topicId){
        await Topic.update(
        {_id: article.topicId},
        {
          $push: pushCondition,
        }).exec();
      }
      await User.findByIdAndUpdateAsync(article.authorId, {$inc: incCondition});
    }
    
    

    if(article.type != 'class' && article.type != 'ted' && article.type != 'post' && article.type != 'blog'){

      // 上架的话发送通知给关注的人
      if(article.active){
        if(article.topicId){
          let topic = await Topic.findByIdAsync(article.topicId);
          // 通过article.topicId找到collects
          const collects = topic.collects;
          if(collects){
          collects.map((collect_user) => {
              if(collect_user.toString() != article.authorId.toString()){
                //message.sendMessage(article.authorId, collect_user, article.topicId, 'topic', 'push', article._id);
                message.sendMessage( collect_user,article.authorId, article.topicId, 'topic', 'push', article._id);
              }
            });
          }
        }

        //同时也通知投稿人审核通过
        if(article.authorId.toString() != req.user._id.toString()){
          message.sendMessage(article.authorId, req.user._id, article._id, article.type, 'confirm');
        }
      } 
    }

    return res.status(200).send({success: true, data: article});
  }

  @swallow
  static async getArticles(req, res, next){
    const page = parseInt(req.query.page, 10) || 1;
    let query = {};
    let sort = {};
  
    /*if (req.query.type === 'top') {
      query.top = true;
    } else if (req.query.type === 'hot') {
      sort = { score: -1, created_at: -1, };
    } else if (req.query.type === 'latest') {
      sort = { created_at: -1, };
    }*/
    if(!req.query.from){
      query.active = true
    }

    if (req.query.type) {
      query.type = req.query.type;
    }
    
    if(req.query.topicId && req.query.topicId != "undefined") {
      query.topicId = req.query.topicId;
    }

    if(req.query.tagId){
      query.tags = { '$all': [req.query.tagId] }
    }

    if(req.query.user_id){
      query.collects = { '$all': [req.query.user_id] }
    }

    if(req.query.author_id){
      query.authorId = req.query.author_id
    }

    if(req.query.isBanner){
      query.isBanner = true;
    }

    if(req.query.search){
      let search  = validator.trim(req.query.search)
      query.title = new RegExp(search, 'i');
    }

    if(req.query.recommend == 'hot'){
      sort = {score: -1, created_at: -1};
    }else if(req.query.recommend == 'week'){
      sort = {weekScore: -1, created_at: -1};
      query.type = { $nin:['class','blog'] };
    }else if(req.query.recommend == 'month'){
      sort = {monthScore: -1, created_at: -1};
      query.type = { $nin:['class','blog'] };
    }else if(req.query.type == 'all'){
      sort = {created_at: -1};
      query.type = { $nin:['class','blog', 'post'] };
    }
    else{
      sort = {top: -1,  created_at: -1};
    }

    let result = await cache.get(`articles:${req.query.type}:${page}`);
    // if ( Object.keys(result).length < 1  || !result ) {
    if ( !result ) {
      result = await Article.paginate(query,
      {
        populate: [
          {path: 'authorId', model: 'User', select: '_id name description headimgurl'},
          {path: 'topicId', model: 'Topic', select: '_id title'},
          {path: 'tags', model: 'Tag', select: '_id name'},
        ],
        page: page,
        limit: Number(req.query.limit) || 10,
        sort: sort,
      });
      /*if (page === 1) {
        if (req.query.type === 'hot') {
          cache.set(`articles:${req.query.type}:${page}`, result, config.cachetime);
        }
        cache.set(`articles:${req.query.type}:${page}`, result);
      }*/
    }


    res.json({
      data: result.docs,
      count: result.pages,
      total: result.total
    });
  }

}

