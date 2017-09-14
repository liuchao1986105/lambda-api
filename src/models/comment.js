import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';

const CommentSchema = new mongoose.Schema({
  content: { type: String },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
  // 针对评论的回复
  replys: [{
    content: String, // 回复内容
    user_info: Object,
    created: Date,
  }],
  active: { type: Boolean, default: true },
});

class CommentModel { }

CommentSchema.plugin(loadClass, CommentModel);
CommentSchema.plugin(baseModel);
CommentSchema.plugin(mongoosePaginate);
CommentSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

CommentSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
export const Comment = mongoose.model('Comment', CommentSchema);