import Promise from 'bluebird';
import { Message } from '../models/message';
import { User } from '../models/user';
import { swallow } from '../utils/decorators';
import mail from '../utils/email';
import validator from 'validator';
const ObjectId = require('mongoose').Types.ObjectId;

export default class MessageController {
/*  @swallow
  static async getUserMessges(req, res, next){
    const unReadMsgs = await Message.findAsync({
      masterId: req.user._id,
      hasRead: false,
      active: true,
    }, null, {
      // skip: 0, // Starting Row
      // limit: 10, // Ending Row
      // select: 'type created_at',
      sort: {
        created_at: -1,
      },
    }).populate([
      {path: 'articleId', model: 'Article', select: '_id title visitCount collectCount'},
    ]).exec();
    await MessageController._updateMessagesToRead(req.user._id, unReadMsgs);
    return res.json({success: true, data: unReadMsgs});
  }*/

  @swallow
  static async getUserMessges(req, res, next) {
    const query = {masterId: req.query.user_id, active: true};

    const result = await Message.paginate(query, {
      populate: [
        {path: 'articleId', model: 'Article', select: '_id title'},
        {path: 'topicId', model: 'Topic', select: '_id title'},
        {path: 'authorId', model: 'User', select: '_id name headimgurl'},
      ],
      page: parseInt(req.query.page, 10) || 1,
      limit: Number(req.query.limit) || 1000,
      sort: {
        top: -1,
        created_at: -1,
      }
    })

    await Message.updateAsync({hasRead: false, active: true}, { $set: { hasRead: true } }, { multi: true });

    res.json({
      data: result.docs,
      count: result.pages,
      total: result.total
    });
  }

  @swallow
  static async getMessgesCount(req, res, next) {
    let count = 0;
    if(req.user){
      count = await Message.countAsync({masterId: req.user._id, hasRead: false, active: true});
    }

    return res.json({success: true, data: count});
  }

  static _updateMessagesToRead(userId, unReadMsgs) {
    if (unReadMsgs.length === 0) {
      return;
    }

    const ids = unReadMsgs.map((msg) => {
      return msg._id;
    });

    const query = { masterId: userId, _id: { $in: ids } };
    return Message.updateAsync(query, { $set: { hasRead: true } }, { multi: true });
  }

  @swallow
  static async sendInfo(req, res, next) {
    //获取所有用户
    
    const users = await User.findAsync({
      active: true,
      email: {$ne:''} ,
    });

   User.find({
      active: true,
      email: {$ne:''} ,
    }).limit(0).batchSize(100).stream().on('data', (user) => {
      if (!user) {
        return;
      }
      mail.sendInfoToUser(req.body.description, user.email, user.name);

     
    }).on('error', (err) => {

    }).on('close', () => {
      // the stream is closed
    });


    return res.json({success: true, data: users.length});
  }


}
