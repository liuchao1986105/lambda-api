import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';

const TagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: { type: String },  // topic , article
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }, //当type为article时topicId不为空
  sort: { type: Number, default: 1},
  active: { type: Boolean, default: true },
});

class TagModel { }

TagSchema.plugin(loadClass, TagModel);
TagSchema.plugin(baseModel);
TagSchema.plugin(mongoosePaginate);
TagSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

TagSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.active;
    delete ret.__v;
    return ret;
  },
});
export const Tag = mongoose.model('Tag', TagSchema);
