import express from 'express';
import passport from 'passport';
import config from '../../config/env';
import auth from '../auth.service';
const router = express.Router();
// weibo ---------------------------------

router
  .get('/', auth.snsPassport(), passport.authenticate('weibo', {
    failureRedirect: '/',
    session: false,
  }))
  .get('/callback', function(req, res, next) {
    passport.authenticate('weibo', {
      session: false,
    }, function(err, user, redirectURL) {
      const redirectUrl = req.session.passport.redirectUrl || '/';
      const snsmsg = {};
      const cookieDomain = config.session.cookie.domain || null;
      if (err) {
        snsmsg.msg = err.message;
        snsmsg.msgtype = 'error';
      } else if (!user) {
        snsmsg.msg = '登录失败,请重试';
        snsmsg.msgtype = 'error';
      } else {
        snsmsg.msgtype = 'success';
        snsmsg.msg  = '登录成功,欢迎光临!';
        const token = auth.signToken(user._id);
        res.cookie('token', JSON.stringify(token), {domain: cookieDomain});
      }
      res.cookie('snsmsg', JSON.stringify(snsmsg), {domain: cookieDomain, maxAge: 30000});
      return res.redirect(redirectUrl);
    })(req, res, next);
  });

module.exports = router;
