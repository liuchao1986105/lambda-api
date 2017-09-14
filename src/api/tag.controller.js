import Promise from 'bluebird';
import { Tag } from '../models/tag';
import { Topic } from '../models/topic';
import { swallow } from '../utils/decorators';
import validator from 'validator';
import _ from 'lodash';
const ObjectId = require('mongoose').Types.ObjectId;

export default class TagController {
  @swallow
  static async getTag(req, res, next) {
    const tag = await Tag.findByIdAsync(req.params.tag_id);
    res.json({success: true, data: tag});
  }

  @swallow
  static async addTag(req, res, next) {
    const name = validator.trim(req.body.name);

    let error;
    if(name === '') {
      error = '标签名称不能为空';
    }
    if(error){
      return res.status(422).send({success: false, error_msg: error});
    }

    const tag = await Tag.findOneAsync({name:name});
    // if (tag) {
    //   return res.status(403).send({success: false, error_msg:'标签名称已经存在.'});
    // } else {
      req.body.name = name;
      const newTag = await Tag.createAsync(req.body);
      return res.status(200).json({ success: true, data:newTag, tag_id: newTag._id});
    // }
  }

  @swallow
  static async updateTag(req, res, next){
    const name = validator.escape(validator.trim(req.body.name));

    let error;
    if(name === '') {
      error = '标签名称不能为空';
    }
    if(error){
      return res.status(422).send({success: false, error_msg: error});
    }

    req.body.name = name;
    const tag = await Tag.findByIdAndUpdateAsync(req.params.tag_id, req.body, {new:true});
    return res.status(200).send({success: true, tag_id: tag._id});
  }

  @swallow
  static async deleteTag(req, res, next) {
    let tag = await Tag.findByIdAndUpdateAsync(req.params.tag_id, {$set: {active: false}});
    return res.status(200).send({success: true, data: tag});
  }

  @swallow
  static async getTags(req, res, next) {
    const query = {active: true};
    if(req.query.type){
      query.type = req.query.type
    }
    if(req.query.topicId && req.query.topicId != "undefined") {
      query.topicId = req.query.topicId;
    }
    if(req.query.topicName && req.query.topicId != "undefined"){
      const topic = await Topic.findOneAsync({title:req.query.topicName});
      if(topic && topic._id){
        query.topicId = topic._id
      }
    }

    let tags = await Tag.findAsync(query, null, {
      // skip: 0, // Starting Row
      // limit: 10, // Ending Row
      // select: 'created_at',
      sort: {
        sort: 1,
      },
    });

    tags = await Tag.populateAsync(tags, [{path: 'topicId', model: 'Topic', select: '_id title'}]);

    return res.status(200).json({success: true, data: tags});
  }
}
