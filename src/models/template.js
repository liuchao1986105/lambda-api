import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';

const TemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  origin: {type: String},
  url: {type: String},
  img: { type: String },
  likeList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  mode: { type: String, default: 'task'},
  top: { type: Boolean },
  subject: { type: String },
  description: { type: String },
  tasklist: { type: Array },
  top: { type: Boolean, default: false },
  active: { type:Boolean, default: true}
});

class TemplateModel {}

TemplateSchema.plugin(loadClass, TemplateModel);
TemplateSchema.plugin(baseModel);
TemplateSchema.plugin(mongoosePaginate);
TemplateSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

TemplateSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.updated_at;
    delete ret.active;
    delete ret.__v;
    return ret;
  },
});

export const Template = mongoose.model('Template', TemplateSchema);
