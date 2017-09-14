import passport from 'passport';
const LocalStrategy = require('passport-local').Strategy;

exports.setup = function(User, config) {
  passport.use(new LocalStrategy({
    usernameField: 'name',
    passwordField: 'password', // this is the virtual field on the model
  },
    function(name, password, done) {
      let query = {name: name}

      if (/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/.test(name)) {
        query = {email: name}
      }

      User.findOne(query, function(err, user) {
        if (err) return done(err);
        if (!user) {
          global.logger.error('登录用户名错误', {'username': name});
          return done(null, false, { error_msg: '用户名或密码错误.' });
        }
        if (!user.authenticate(password)) {
          global.logger.error('登录密码错误', {'username': name});
          return done(null, false, { error_msg: '用户名或密码错误.' });
        }
/*				if(user.status === 2){
          logger.error('被阻止登录', {'username':name});
					return done(null, false, { error_msg: '用户被阻止登录.' });
				}
				if(user.status === 0){
          logger.error('未验证用户登录',{'username':name});
					return done(null, false, { error_msg: '用户未验证.' });
				}*/
        return done(null, user);
      });
    }
  ));
};
