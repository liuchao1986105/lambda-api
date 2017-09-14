import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';

const UserPostSchema = new mongoose.Schema({
  feed_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Feed' },  // 文章订阅源 ID
  user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // 用户 ID
  post_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },  // 文章 ID
  mark:      { type: Boolean, default: false },    // 星标情
  love:      { type: Boolean, default: false },    // 点赞情况
  read:      { type: Boolean, default: false },    // 是否已读(标记)
  read_date: { type: Date },   // 阅读完的时间
  love_date: { type: Date },   // 点赞时间
  mark_date: { type: Date },   // 收藏时间
});

UserPostSchema.plugin(mongoosePaginate);

UserPostSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
export const UserPost = mongoose.model('UserPost', UserPostSchema);
