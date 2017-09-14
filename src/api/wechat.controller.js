import Promise from 'bluebird';
import { swallow } from '../utils/decorators';
import config from '../config/env';
import { User } from '../models/user';
import auth from '../auth/auth.service';
import validator from 'validator';
import _ from 'lodash';
import request from 'request'

export default class WechatController {
  @swallow
  static getToken(req, res, next) {
    let url = config.wxSmall.LoginUrl + '?appid=' + config.wxSmall.AppID + '&secret=' + config.wxSmall.AppSecret
     + '&js_code=' + req.body.code + '&grant_type=authorization_code';
    request.get({url:url},function(err, httpResponse, body) {
      if (err) {
        return console.error('request:', err);
      }
      let data = JSON.parse(body);
      if(data.errcode){
        res.json({success: false, err_msg: data.errmsg});
      }else{
        User.findOne({openid:data.openid},function(err,user){
          if(user){
            const token = auth.signToken(user._id);
            return res.status(200).json({success:true, token: token, user_id: user._id });
          }else{
            const newUser = new User();
            newUser.name = data.openid;
            newUser.openid = data.openid;
            newUser.saveAsync().then(function(user) {
              const token = auth.signToken(user._id);
              return res.status(200).json({success:true, token: token, user_id: user._id });
            }).catch(function(err) {
              let error;
              if(err.errors && err.errors.name){
                error = {success:false, error_msg: err.errors.name.message}
              }
              return res.status(500).send(error);
            });
          }
        });
        
      }
    });
  }

  @swallow
  static verifyToken(req, res, next) {
    auth.verifyToken(req.body.token, function(err,decode){
      if(err){
        res.status(200).json({isValid: false});
      }else{
        res.status(200).json({isValid:true});
      }
    })
  }
}
