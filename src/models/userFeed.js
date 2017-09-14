import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';


const UserFeedSchema = new mongoose.Schema({
  feed_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Feed' },   // 订阅源 ID
  user_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },   // 用户 ID
  folder:    { type: String, default: 'default' },
  own_title: { type: String },
  feed_time: { type: Date, default: Date.now() },
  unread:    { type: Number }
});

UserFeedSchema.plugin(mongoosePaginate);

UserFeedSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});
export const UserFeed = mongoose.model('UserFeed', UserFeedSchema);
