import Promise from 'bluebird';
import { Order } from '../models/order';
import { User} from '../models/user';
import { swallow } from '../utils/decorators';
import config from '../config/env';
import validator from 'validator';
import _ from 'lodash';
import request from 'request';
import querystring from 'querystring';
import tools from '../utils/tools';

const ObjectId = require('mongoose').Types.ObjectId;

export default class OrderController {
  @swallow
  static async getOrder(req, res, next) {
    const order = await Order.findByIdAsync(req.params.order_id);
    res.json({success: true, data: order});
  }

  @swallow
  static notifyOrder(req, res, next){
    const out_order_no = req.query.out_order_no;
    const total_fee= req.query.total_fee;
    const trade_status = req.query.trade_status;
    const partner = config.passpay.partner;
    const key = config.passpay.key;


global.logger.info("total_fee"+total_fee); 
global.logger.info("trade_status"+trade_status); 
    const val = tools.md5(out_order_no + total_fee + trade_status + partner + key);
global.logger.info("val"+val); 
    const sign = req.query.sign;
    const trade_no = req.query.trade_no;

    if(sign == val){
      if(trade_status == 'TRADE_SUCCESS'){
        res.json("success");
      }else{
        res.json("fail");
      }
    }else{
      res.json("auth fail");
    }
  }

    @swallow
  static returnOrder(req, res, next){
    const out_order_no = req.query.out_order_no;
    const total_fee= req.query.total_fee;
    const trade_status = req.query.trade_status;
    const partner = config.passpay.partner;
    const key = config.passpay.key;

    const val = tools.md5(out_order_no + total_fee + trade_status + partner + key);

    const sign = req.query.sign;
    const trade_no = req.query.trade_no;

    if(sign == val){
      if(trade_status == 'TRADE_SUCCESS'){
        res.json("支付成功");
      }else{
        res.json("支付失败");
      }
    }else{
      res.json("验证失败");
    }
  }

  @swallow
  static async addOrder(req, res, next) {
    let error;
    if(req.body.subject === '') {
      error = '订单名称不能为空';
    }
    if(error){
      return res.status(422).send({success: false, error_msg: error});
    }

    req.body.authorId =  req.user._id; 
    const order = await Order.createAsync(req.body);
    console.log("order:"+JSON.stringify(order))

    // request.post({url:config.passpay.request_url,form:postData},function(err, httpResponse, body) {
    //     if (err) {
    //         return console.error('upload failed:', err);
    //     }
    //     console.log("err:"+JSON.stringify(err))
    //     console.log("httpResponse:"+JSON.stringify(httpResponse))
    //     console.log('Upload successful!  Server responded with:', body);
    // });
    // request.get({url:config.passpay.request_url, qs:postData, json:true}, function (e, r, user) {
    //   global.logger.info("user"+user);
    // })

    return res.status(200).json({ success: true, data:order, order_id: order._id});
  }

  @swallow
  static async updateOrder(req, res, next){
    const order = await Order.findByIdAndUpdateAsync(req.params.order_id, req.body, {new:true});
    return res.status(200).send({success: true, order_id: order._id});
  }

  @swallow
  static async deleteOrder(req, res, next) {
    const order_id = await Order.findByIdAsync(req.params.order_id);
    order_id.active = false;
    await order_id.saveAsync();
    return res.status(200).send({success: true, data: 'delete success'});
  }

  @swallow
  static async getOrders(req, res, next) {
    const query = {active: true};

    if(req.query.authorId){
      query.authorId = req.query.authorId;
    }

    if(req.query.type){
      query.type = req.query.type;
    }

    const result = await Order.paginate(query, {
      populate: [
        {path: 'authorId', model: 'User'},
      ],
      page: parseInt(req.query.page, 10) || 1,
      limit: Number(req.query.limit) || 10000,
      sort: {
        created_at: -1,
      }
    })
    res.json({
      data: result.docs,
      count: result.pages
    });
  }
}
