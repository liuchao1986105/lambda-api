import express from 'express';
import passport from 'passport';
import config from '../../config/env';
import auth from '../auth.service';
const router = express.Router();

// github ---------------------------------

router
  .get('/', auth.snsPassport(), passport.authenticate('github', {
    failureRedirect: '/',
    session: false,
  }))
  .get('/callback', function(req, res, next) {
    passport.authenticate('github', {
      session: false,
    }, function(err, user, redirectURL) {
      //const redirectUrl = req.session.passport.redirectUrl || '/';
      const redirectUrl = 'http://www.lambda-study.com/emailbind';
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
        res.cookie('token', JSON.stringify(token), {domain: cookieDomain, maxAge: 60000 * 60 * 24 *30});  //30d
        //res.cookie('token', JSON.stringify(token));
      }
      res.cookie('snsmsg', JSON.stringify(snsmsg), { domain:cookieDomain, maxAge: 300000});

      if(user.email){
        return res.redirect('http://www.lambda-study.com');
      }else{
        return res.redirect(redirectUrl);
      }
    })(req, res, next);
  });

module.exports = router;
