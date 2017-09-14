import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';


const PostSchema = new mongoose.Schema({
  title: { type: String },
  description: { type: String },
  summary: { type: String },
  date: { type: Date },
  pubdate: { type: Date },
  link: { type: String },
  guid: { type: String },
  author: { type: String },
  comments: { type: String },
  origlink: { type: String },
  categories:  { type: Array },

  website: { type: String },
  feed_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Feed' },   // 订阅源 ID
  loveNum: { type: Number, default: 0 },                     // 点赞数量
  markNum: { type: Number, default: 0 },                      // 星标人数
});


PostSchema.plugin(baseModel);
//PostSchema.plugin(mongoosePaginate);
PostSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

PostSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
export const Post = mongoose.model('Post', PostSchema);
