import passport from 'passport';
import tools from '../../utils/tools';
import  _ from 'lodash'
import configenv from '../../config/env';
import message from '../../utils/message';
const GithubStrategy = require('passport-github').Strategy;

exports.setup = function(User, config) {
  passport.use(new GithubStrategy({
    clientID: config.github.clientID,
    clientSecret: config.github.clientSecret,
    callbackURL: config.github.callback,
    //passReqToCallback: true,
  },
    function( accessToken, refreshToken, profile, done) {
      //const userId = req.session.passport.userId || null;
      const userId = null;
      profile._json.token = accessToken;
      // 如果userId不存在.而新建用户,否而更新用户.
      if (!userId) {
        User.findOne({
          'github.id': profile.id,
        },
        function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            // 用户呢称需要唯一.
            const newUser = {
              name: profile.displayName || profile.username,
              headimgurl: profile._json.avatar_url || '',
              //headimgurl: configenv.qiniuImageUrl + _.random(1, configenv.imgCount) + '.jpg',
              provider: 'github',
              email: profile._json.email || '',
              github: profile._json,
              githubname: profile.displayName || profile.username,
             // status: 1,
            };
            //global.logger.debug("newUser:",newUser);
            User.findOne({name: newUser.name}, function(error, user) {
              if (error) return done(error);
              if (user) {
                newUser.name = tools.randomString();
              }
              user = new User(newUser);
              user.save(function(erro) {
                if (erro) return done(erro);
                User.findOne({name: 'lambda'}, function(err, myname){
                  message.sendMessage(user._id, myname._id, null,  null, 'shareInfo');
                })
                done(erro, user);
              });
            });
          } else {
            return done(err, user);
          }
        });
      }else {
        // 用户已经登录
        return done(new Error('您已经是登录状态了'));
        // var user = req.user;
        // //判断用户是否已经使用了这个provier则提示错误
        // if(!user.github.id){
        //   if(!user.avatar){
        //     user.avatar = profile._json.avatar_url || '';
        //   }
        //   user.github = profile._json;
        //   user.save(function(err) {
        //     if (err) return done(err);
        //     done(err, user);
        //   });
        // }else{
        //   return done(new Error('User is already connected using this provider'), user);
        // }
      }
    }
  ));
};
