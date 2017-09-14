import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';


const FeedSchema = new mongoose.Schema({
  xml: { type: String },
  type: { type: String },
  version: { type: String },
  title: { type: String },
  description: { type: String },
  date: { type: Date },
  pubdate: { type: Date },
  link: { type: String },
  xmlurl: { type: String },
  absurl: { type: String },
  author: { type: String },
  langulage: { type: String },
  favicon: { type: String },
  copyright: { type: String },  
  generator: { type: String }, 
  categories: { type: String },  
  
  feedNum:  { type: Number, default: 0 },         // 订阅人数
  active: { type: Boolean, default: true },  //是否上线
  score:  { type: Number, default: 0 },   //用于排序
  top: { type: Boolean, default: false }
});


FeedSchema.plugin(baseModel);
FeedSchema.plugin(mongoosePaginate);
FeedSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

FeedSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
export const Feed = mongoose.model('Feed', FeedSchema);
