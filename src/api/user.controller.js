import Promise from 'bluebird';
import { User } from '../models/user';
import { swallow } from '../utils/decorators';
import captchapng from 'captchapng';
import validator from 'validator';
import config from '../config/env';
import auth from '../auth/auth.service';
import message from '../utils/message';
import tools from '../utils/tools';
import moment from 'moment'
import mail from '../utils/email';
import jwt from 'jsonwebtoken';

export default class UserController {
  @swallow
  static async getUser(req, res, next) {
    //global.logger.info(req.params.user_id);
    let user = await User.findByIdAsync(req.params.user_id);
    return res.json({success: true, data: user});
  }

  @swallow
  static async getUsers(req, res, next){
    const page = parseInt(req.query.page, 10) || 1;
    let query = {active: true};
    let sort = {created_at: -1};

    if(req.query.search){
      let search  = validator.trim(req.query.search)
      query.name = new RegExp(search, 'i');
    }

    const  result = await User.paginate(query,
      {
        page: page,
        limit: Number(req.query.limit) || 10,
        sort: sort,
      });

    res.json({
      data: result.docs,
      count: result.pages,
      total: result.total
    });
  }


  @swallow
  static async getMe(req, res, next) {
    const userId = req.user._id;
    let user = await User.findByIdAsync(userId);
    //user = await user.populate([ {path: 'collectedTopics', model: 'Topic', select: '_id  title description'}]).execPopulate();
    res.json(user.userInfo);
  }

  @swallow
  static async signUp(req, res, next){
    const name = validator.escape(validator.trim(req.body.name));
    const email = validator.trim(req.body.email);
    const password = validator.trim(req.body.password);
    let errorMsg;
    if (process.env.NODE_ENV !== 'test') {
      if (!req.body.captcha) {
        errorMsg = '验证码不能为空';
      } else if (req.session.captcha !== parseInt(req.body.captcha)) {
        errorMsg = '验证码错误';
      }
    }

    if (!name || !password) {
      errorMsg = '用户名或密码不能为空';
    } else if(!email) {
      errorMsg = '邮箱地址不能为空';
    }else if(!validator.isEmail(email)) {
      errorMsg = "邮箱地址不合法";
    }

    let user = await User.findOneAsync({name:name});
    if ( user){
      errorMsg = "该用户名已经存在";
    }

    user = await User.findOneAsync({email:email});
    if ( user){
      errorMsg = "该邮箱名已经存在";
    }

    if (errorMsg) {
      return res.status(400).send({error_msg: errorMsg});
    }

    const newUser = new User();    //var newUser = new User(req.body);
    newUser.name = name;
    newUser.email = email;
    newUser.password = password;
    newUser.headimgurl = req.body.headimgurl;
    newUser.role = ((name === 'lambda') ? 'admin' : 'user');
    newUser.invitor = req.body.invitor;

    user = await newUser.saveAsync();

    const lambda = await User.findOneAsync({name: 'lambda'});

    message.sendMessage(user._id, lambda._id, null,  null, 'shareInfo');
    const token = auth.signToken(user._id);
    return res.status(200).json({success:true, token: token, user_id:user._id});
  }

  @swallow
  static async updateUser(req, res, next){
    //global.logger.debug(req.user._id.toString(), 'user_id');
    if (req.params.user_id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).send({success: false, data: '没有权限对该用户进行更新'});
    }

    //const name = req.body.name;
    //const email = validator.trim(req.body.email);

    let error;
    // if(name === '') {
    //   error = '用户名不能为空';
    // }

    if(error){
      return res.status(422).send({success: false, error_msg: error});
    }

    const currentuser = await User.findByIdAsync(req.params.user_id);

    //req.body.name = name;
    if(req.body.isPayed){
      req.body.payTime = new Date();
      
    }
    const user = await User.findByIdAndUpdateAsync(req.params.user_id, req.body, {new:true});
    
    //&& (moment().diff(moment(currentuser.payTime), 'years') < 1
    if(user.invitor && req.body.isPayed ){
      // 发消息给invitor
      message.sendMessage(user.invitor, req.params.user_id, '', 'invite', 'pay');
      const invited = {
        user_id: user._id,
        user_name: user.name,
        created: new Date(),
      };

     await User.findByIdAndUpdate(user.invitor, {$push: {inviteds: invited}}, {new: true});
    }

    //往inviteds者里添数据
    
    return res.status(200).send({success: true, user_id: user._id});
  }

  @swallow
  static async setUser(req, res, next){
    //const name = validator.escape(validator.trim(req.body.name));
    // let requser = await User.findOneAsync({name:req.body.name});
    // if (requser){
    //   req.body.name = req.body.name + '_' +tools.randomString(6);
    // }

    const user = await User.findByIdAndUpdateAsync(req.user._id, req.body, {new:true});
    
    return res.status(200).send({success: true, data: user});
  }

  @swallow
  static async deleteUser(req, res, next){
    const userId = req.user._id;

    if(String(userId) === String(req.params.user_id)){
      return res.status(403).send({success: false, data:"不能删除自己已经登录的账号"});
    }
    let user = await User.findByIdAsync(req.params.user_id);
    user.active = false;
    await user.saveAsync();
    return res.status(200).send({success: true, data: 'delete success'});
  }

  static async changePayedStatus(req, res, next){
    let user = await User.findByIdAsync(req.params.user_id);
    user.isPayed = false;
    await user.saveAsync();
    return res.status(200).send({success: true, data: 'changePayedStatus success'});
  }

  static async sendResetMail(req, res, next){
    const token = auth.signToken(req.body.email);
    mail.sendResetPassMail(req.body.email, token);
    return res.status(200).send({success: true});
  }

  static async sendResetPassword(req, res, next){
    const eamil = jwt.decode(req.body.token);
    const users = await User.findAsync({email: eamil._id});
    const user = users[0];
    user.password = req.body.password;
    await user.saveAsync();
    return res.status(200).send({success: true});
  }

  static getCaptcha(req, res, next){
    let captcha = parseInt(Math.random() * 9000 + 1000);
    global.logger.debug(req.session);
    req.session.captcha = captcha;
    const pic = new captchapng(80, 30, captcha);
    pic.color(0, 0, 0, 0);
    pic.color(200, 200, 200, 255);

    const img = pic.getBase64();
    const imgbase64 = new Buffer(img, 'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    return res.end(imgbase64);
  }

  // 获取第三方登录列表.
  static getSnsLogins(req,res,next){
    if(config.snsLogins){
      return res.status(200).json({success: true, data: config.snsLogins});
    }else{
      return res.status(404).send();
    }
  }

}
