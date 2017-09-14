import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';

/*
 * type:
 * comment: 对article进行了评论
 * reply: xx 在 xx(文章中) 回复了你的评论
 * follow: xx 关注了你
 * at: xx ＠了你
 * collect: 收藏
 * push: 推送
 * pay: 被邀请后支付
 * confirm: 文章审核通过
 * shareInfo: 分享的系统通知
 */

const MessageSchema = new mongoose.Schema({
  type: { type: String },
  target: { type: String },  // message的类型 article/collect
  masterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  //如给谁评论
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, //谁评论
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },  // 具体是对那个comment发送消息的
  hasRead: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
});

class MessageModel { }

MessageSchema.plugin(loadClass, MessageModel);
MessageSchema.plugin(baseModel);
MessageSchema.plugin(mongoosePaginate);
MessageSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

MessageSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
export const Message = mongoose.model('Message', MessageSchema);
