// 生产环境配置
// =================================
module.exports = {
  // 生产环境mongodb配置
  host:'http://www.lambda-study.com',
  mongo: {
    uri: 'mongodb://lambda:jingjing1314@106.14.30.242:27017/lambda-server',
    // "mongodb://capricorn:EBN5dKcHpGzqg4i9J9Gw8O@101.200.134.85:32772/wddb",
    options: {
      db: {
        safe: true,
      },
      // user:'user',          //生产环境用户名
      // pass:'pass'           //生产环境密码
    },
  },
  // 生产环境redis配置
  redis: {
    //host: '127.0.0.1',
    host: '106.14.30.242',
    port: 6379,
    password: 'jingjing1314',
    db: 1,
  },

  // 生产环境cookie是否需要domain视具体情况而定.
  session: {
    cookie: {maxAge: 60000 * 5, domain:'.lambda-study.com'},
  },
};
