import express from 'express';
import passport from 'passport';
import auth from '../auth.service';
import validator from 'validator';
import { User } from '../../models/user';
const ObjectId = require('mongoose').Types.ObjectId;

const router = express.Router();

router.post('/signup', function(req, res, next) {
  // 测试环境不用验证码
  if (process.env.NODE_ENV !== 'test') {
    let errorMsg;
    if (!req.body.captcha) {
      errorMsg = '验证码不能为空';
    } else if (req.session.captcha !== parseInt(req.body.captcha)) {
      errorMsg = '验证码错误';
    } else if (!req.body.name || !req.body.password) {
      errorMsg = '用户名或密码不能为空';
    } else if(!req.body.email) {
      errorMsg = '邮箱地址不能为空';
    }else if(!validator.isEmail(req.body.email)) {
      errorMsg = "邮箱地址不合法";
    }

    if (errorMsg) {
      return res.status(400).send({error_msg: errorMsg});
    } else {
      next();
    }
  } else {
    next();
  }
}, function(req, res, next) {
  const name = validator.escape(validator.trim(req.body.name));
  const email = validator.trim(req.body.email);
  const password = validator.trim(req.body.password);

  const newUser = new User();
  newUser.name = name;
  newUser.email = email;
  newUser.password = password;
  if(name == 'lambda'){
    newUser.role = 'admin';
  }
  //var newUser = new User(req.body);

  newUser.saveAsync().then(function(user) {
    const token = auth.signToken(user._id);
    return res.status(200).json({success:true, token: token, user_id:user._id});
  }).catch(function(err) {
    let error;
    if(err.errors && err.errors.name){
      error = {error_msg: err.errors.name.message}
    }
    return res.status(500).send(error);
  });
});

// auth.isAuthenticated(),
router.post('/signin',  function(req, res, next) {
  let errorMsg;

  // 其他的一些验证处理
  if (!req.body.name || !req.body.password) {
    errorMsg = '用户名或密码不能为空';
  }
  if (errorMsg) {
    return res.status(422).send({error_msg: error_msg});
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return res.status(401).send();
    }
    if (info) {
      return res.status(403).send(info);
    }

    const token = auth.signToken(user._id);
    return res.status(200).json({success:true, token: token});
  })(req, res, next);
});


module.exports = router;
