import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';

const TopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  img: { type: String },
  top: { type: Boolean, default: false }, // 置顶帖
  collects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // 关注
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  docs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article' }],
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  defaultCollects: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  price: { type: Number, default: 0 },
  url: { type: String },  // 视频的url
  password: { type: String }, //视频的密码
  tburl: { type: String }, 
  sns: { type: String }, //云售的id
  score: { type: Number, default: 0 }   // 为了给topic排序
});

class TopicModel { }

TopicSchema.plugin(loadClass, TopicModel);
TopicSchema.plugin(baseModel);
TopicSchema.plugin(mongoosePaginate);
TopicSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

TopicSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    ret.numberOfVideos = ret.videos ? ret.videos.length : 0;
    ret.numberOfBooks = ret.books ? ret.books.length : 0;
    ret.numberOfArticles = ret.docs ? ret.docs.length : 0;
    ret.numberOfCollects = ret.collects ? ret.collects.length :0;
    ret.numberOfAllCollects = ret.numberOfCollects + ret.defaultCollects;
/*    delete ret.videos;
    delete ret.docs;*/
    delete ret.active;
    delete ret.__v;
    return ret;
  },
});
export const Topic = mongoose.model('Topic', TopicSchema);
