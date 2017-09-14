import Promise from 'bluebird';
import { Topic } from '../models/topic';
import { User, Values } from '../models/user';
import { swallow } from '../utils/decorators';
import config from '../config/env';
import qiniuHelper from '../utils/qiniu';
import validator from 'validator';
import _ from 'lodash';
const ObjectId = require('mongoose').Types.ObjectId;

export default class TopicController {
  @swallow
  static async getTopic(req, res, next) {
    //const topic = await Topic.findByIdAsync(req.params.topic_id);
    //const data = topic ? { ...topic.toJSON() } : null;
    // topic的详细信息
    const topic_id = new ObjectId(req.params.topic_id);
    const topic = await Topic.findById(new ObjectId(req.params.topic_id)).populate([
      {path: 'videos', model: 'Article'},
      //{path: 'tags', model: 'Tag', select: '_id name'},
      {path: 'docs', model: 'Article'}
    ]).exec();
    res.json({success: true, data: topic});
  }

  @swallow
  static async addTopic(req, res, next) {
    const title = validator.escape(validator.trim(req.body.title));

    let error;
    if(title === '') {
      error = '主题名不能为空';
    }
    if(error){
      return res.status(422).send({success: false, error_msg: error});
    }

    req.body.title = title;
    const topic = await Topic.createAsync(req.body);
    return res.status(200).json({ success: true, data:topic, topic_id: topic._id});
  }

  @swallow
  static async updateTopic(req, res, next){
    const title = validator.escape(validator.trim(req.body.title));

    let error;
    if(title === '') {
      error = '主题名不能为空';
    }
    if(error){
      return res.status(422).send({success: false, error_msg: error});
    }

    req.body.title = title;
    const topic = await Topic.findByIdAndUpdateAsync(req.params.topic_id, req.body, {new:true});
    return res.status(200).send({success: true, topic_id: topic._id});
  }

  @swallow
  static async deleteTopic(req, res, next) {
    const topic = await Topic.findByIdAsync(req.params.topic_id);
    topic.active = false;
    await topic.saveAsync();
    return res.status(200).send({success: true, data: 'delete success'});
  }

  @swallow
  static async getTopics(req, res, next) {
    const query = {active: true};
    if(req.query.tagId){
      query.tags = {$all:req.query.tagId}
    }

    if(req.query.user_id){
      query.collects = { '$all': [req.query.user_id] }
    }

    if(req.query.search){
      let search  = validator.trim(req.query.search)
      query.title = new RegExp(search, 'i');
    }

    const result = await Topic.paginate(query, {
      populate: [
        {path: 'tags', model: 'Tag', select: '_id name'},
      ],
      page: parseInt(req.query.page, 10) || 1,
      limit: Number(req.query.limit) || 10000,
      sort: {
        top: -1,
        score: -1,
        created_at: -1,

      }
    })
    res.json({
      data: result.docs,
      count: result.pages
    });
  }

  @swallow
  static async putCollect(req, res, next) {
    const user = req.user;
    const topic = await Topic.findOneAsync({_id: req.params.topic_id});
    if (_.findIndex(topic.collects,  user._id) !== -1) {
      return res.status(422).send({success: false, error_msg: '已经关注过'});
    }
    topic.collects.addToSet(req.user);
    await topic.saveAsync();

    await User.update(
      {_id: req.user._id},
      {
        $push: {collectedTopics: {$each: [topic], $position: 0,}},
        $inc: {score: Values.collect},
      }).exec();

    return res.json({success: true, data: 'collected', isCollected: true});
  }

  @swallow
  static async deCollect(req, res, next) {
    await Topic.update(
      {_id: req.params.topic_id},
      {
        $pull: {collects: req.user._id}
      }).exec();

    await User.update(
      {_id: req.user._id},
      {
        $pull: {collectedTopics: req.params.topic_id},
        $inc: {score: -Values.collect},
      }).exec();

    return res.json({success: true, data: 'decollected', isCollected: false});
  }

 // 获取banner图片
  static getIndexImage(req, res, next) {
    //使用redis缓存图片列表.
    global.redis.llen('indexImages').then(function (imagesCount) {
      console.log("indexImages count:"+ imagesCount)
      if(imagesCount < 1){
        res.status(200).json({success: true, img: config.defaultIndexImage});
        return qiniuHelper.list('lambda/banner/','',30).then(function(result){
          return Promise.map(result.items,function (item) {
            return global.redis.lpush('indexImages',config.qnConfig.DOMAIN + '/' + item.key);
          });
        });
      }else{
        return global.redis.lrange('indexImages', 0, 30).then(function (images) {
          var index = _.random(images.length - 1);
          return res.status(200).json({success:true,img:images[index]});
        });
      }
    }).catch(function (err) {
      //global.redis.del('indexImages');
      console.log("err:"+err)
      return next(err);
    });
  }

}
