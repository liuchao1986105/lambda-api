import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';


/*
type:
  1.mall
  2.article
  3.topic
*/

/*
 * state:
 * toPay: 待付款
 * canceled: 订单取消
 * timeout: 支付超时
 * payed： 已付款
 * refunded: 已退款
 * applyrefund :申请退款
 */

const OrderSchema = new mongoose.Schema({
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  //谁支付的
  subject: { type: String },  // 订单名称
  body: { type: String },   //订单描述
  type: { type: String },  //mall lambda
  total_fee: { type: Number, default: 0 },
  state:{ type: String, default:"toPay" },
  active: { type: Boolean, default: true },
});

class OrderModel { }

OrderSchema.plugin(loadClass, OrderModel);
OrderSchema.plugin(baseModel);
OrderSchema.plugin(mongoosePaginate);
OrderSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

OrderSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    delete ret.active;
    delete ret.__v;
    return ret;
  },
});
export const Order = mongoose.model('Order', OrderSchema);
