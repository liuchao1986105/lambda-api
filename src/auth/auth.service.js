import jwt from 'jsonwebtoken';
import expressJwt from 'express-jwt';
import compose from 'composable-middleware';
import config from '../config/env';
import { User } from '../models/user';
import moment from 'moment';

/**
 * 验证token
 */
function authToken(credentialsRequired) {
  return compose()
    .use(function(req, res, next) {
      if (req.query && req.query.hasOwnProperty('access_token')) {
        req.headers.authorization = 'Bearer ' + req.query.access_token;
      }
      // check the token expiry and ensure the token is still valid
/*      if (process.env.NODE_ENV !== 'development' && decoded.exp <= Date.now()) {
        throw Errors.AuthenticationError;
      }*/
      next();
    })
    .use(expressJwt({
      secret: config.session.secrets,
      credentialsRequired: credentialsRequired, // 是否抛出错误
    }));
}
/**
 * 验证用户是否登录
 */
function isAuthenticated() {
  return compose()
    .use(authToken(true))
    .use(function(err, req, res, next) {
      // expressJwt 错误处理中间件
      if (err.name === 'UnauthorizedError') {
        return res.status(401).send({success: false, data: 'authorized error'});
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).send({success: false, data: 'jwt expired'});
      }
      next();
    })
    .use(function(req, res, next) {
      User.findById(req.user._id, function(err, user) {
        if (err) return res.status(500).send({success: false, data: JSON.stringify(err)});
        if (!user) return res.status(401).send({success: false, data: '该用户不存在'});
        req.user = user;
        next();
      });
    });
}

/**
 * 验证用户权限
 */
function hasRole(roleRequired) {
  if (!roleRequired) throw new Error('Required role needs to be set');

  return compose()
    .use(isAuthenticated())
    .use(function meetsRequirements(req, res, next) {
      if (config.userRoles.indexOf(req.user.role) >= config.userRoles.indexOf(roleRequired)) {
        next();
      } else {
        return res.status(403).send({success: false, err_msg: 'you do not have role to invite.'});
      }
    });
}

/**
 * 验证用户是否是自己
 */
function isSelf() {
  return compose()
    .use(isAuthenticated())
    .use(function(req, res, next) {
      if (req.params.user_id == req.user._id.toString()) {
      // if (!req.user._id.equals(deal.user)) {
       // throw Errors.PermissionDeniedError;
        next();
      } else {
        return res.status(403).send({success: false, data: 'you do not have auth to invite.'});
      }
    });
}


/**
 * 生成token
 */
function signToken(id) {
  return jwt.sign({ _id: id }, config.session.secrets, { expiresIn: '31d' });  //1y
}

function verifyToken(token, callback){
  jwt.verify(token, config.session.secrets, function(err, decoded) {
    if (err) {
       /*
      err = {
        name: 'TokenExpiredError',
        message: 'jwt expired',
        expiredAt: 1408621000
      }
    */
      return callback(err);
    }
    callback(null, decoded);
  });
}


function _successRedirect(res, user, secrect, redirectUrl) {
  const expires = moment().add(7, 'days').valueOf();
  const token = jwt.encode({
    userId: user.id,
    exp: expires,
  }, secrect);
  const domain = '.com';
  res.cookie('userId', user.id, { domain, expires: 0, httpOnly: true });
  res.cookie('access_token', token, { domain, expires: 0, httpOnly: true });
  res.redirect(redirectUrl);
}

/**
 * sns登录传递参数
 */
function snsPassport() {
  return compose()
    .use(authToken(false))
    .use(function( req, res, next) {
      req.session.passport = {
        redirectUrl: req.query.redirectUrl || '/',
      };
      if (req.user) {
        req.session.passport.userId = req.user._id;
      }
      next();
    });
}

exports.isAuthenticated = isAuthenticated;
exports.hasRole = hasRole;
exports.signToken = signToken;
exports.snsPassport = snsPassport;
exports.isSelf = isSelf;
exports.verifyToken = verifyToken;