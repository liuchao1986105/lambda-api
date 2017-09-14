import mongoose from 'mongoose';
import baseModel from './base';
import { customTime } from '../utils/tools'
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';

// 计算一篇文章的热门值
export const Scores = {
  collect: 3,
  comment: 2,
  visit: 1,
};

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  imgs: { type: Array },
  top: { type: Boolean, default: false },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  visitCount: { type: Number, default: 0 },
  collects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 收藏
  collectCount: { type: Number, default: 0 },
  lastReplyAt: { type: Date},
  url: { type: String },  // 视频的url
  password: { type: String }, //视频的密码
  shareurl: { type: String },  //分享的url
  type: { type: String },  // doc video book blog
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }], // 一篇文章可以有多个标签
  isCollected: { type: Boolean },
  score: { type: Number, default: 0 },
  weekScore: { type: Number, default: 0 },  //用于计算本周最热
  monthScore: { type: Number, default: 0 },  //用于计算本月最热
  active: { type: Boolean, default: false },  //是否审核通过
  single: { type: Boolean, default: false },
  price: { type: Number},  // class
  classImg: { type: String },
  classPeople: { type: Number},
  classDesc: { type: String },
  classRepay: { type: Number, default: 5 },  //回报率
  classJoined: { type: Number, default: 0 },   //众筹已参加的人数
  //classState: { type: String, default: '众筹进行中' } //状态     众筹进行中，众筹结束

  //下面的字段表示缩放显示在首页的banner里
  isBanner: { type: Boolean, default: false },
  cover: { type: String } //封面
});

class ArticleModel { 
  /*get score() {
    return (this.comments ? this.comments.length : 0)  * Scores.comment + this.visitCount * Scores.visit + this.collectCount * Scores.collect + this.defaultScore;
  }*/
}

ArticleSchema.plugin(loadClass, ArticleModel);
ArticleSchema.plugin(baseModel);
ArticleSchema.plugin(mongoosePaginate);
ArticleSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

ArticleSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    //ret.score = doc.score;
    ret.commentNum = ret.comments ? ret.comments.length :0;
    ret.created_time = customTime(ret.created_at);
    delete ret.__v;
    delete ret.lastReplyAt;
    delete ret.imgs;
    return ret;
  },
});
export const Article = mongoose.model('Article', ArticleSchema);
