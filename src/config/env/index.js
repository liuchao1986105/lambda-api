import path from 'path';
import _ from 'lodash';

const all = {
  env: process.env.NODE_ENV,
  name: 'Lambda程序员学习社区',
  root: path.normalize(__dirname + '/../../..'),
  port: process.env.PORT || 9000,
  domain: 'server.com',
  imgCount: 145,
  qiniuImageUrl: 'https://assets.lambda-study.com/images/',

  // 缓存时间
  cachetime: 60 * 60 * 1,

  // 是否初始化数据
  seedDB: false,

  session: {
    secrets: 'server-secret',
  },

  // 用户角色种类
  userRoles: ['user', 'admin'],

  // 管理员用户
  admin: 'moomoo',

  // 默认图片.
  defaultIndexImage: 'assets.lambda-study.com/lambda/banner/banner1.jpg',

  // cfliu是管理员
  admins: { cfliu: true },

  // 七牛配置
  qnConfig: {
    ACCESS_KEY: '3KR9XesqJfrRovVdiHHW6veHMV4GlJNzDl7t3cgc',
    SECRET_KEY: 'zSucooDVYjKKq6pLdInUWlbwob6K632OrD7Yy9PK',
    BUCKET_NAME: 'bmoji',  // 七牛空间名称
    DOMAIN: 'assets.lambda-study.com',  // 七牛配置域名
  },

  // 本地文件上传配置
  upload: {
    path: path.join(path.normalize(__dirname + '/../../..'), 'uploads/'),
    url: 'uploads/',
  },

  // 微信扫码
  wechatConfig: {
    AppID: 'wxa57d9a5057f4c8a8',
    AppSecret: 'b44bcf415eae0b0ef0bfc81ff35c68eb',
    // token: 'e6a0c486a65e44b5969a9823fccf1d94',
    // encodingAESKey: 'wApsDaMPSI7T4rRhSbvfZNx7loLoqgBryALRxDdzQ2s',
  },

  // 微信登录
  wxLogin: {
    AppID: 'wxe6daee2f551e94a7',
    AppSecret: '3000b99e67fa36b170b2cf373b37d326',
  },

  wxSmall: {
    LoginUrl:'https://api.weixin.qq.com/sns/jscode2session',
    AppID: 'wxb627ee31b0499977',
    AppSecret: '8d28bb2319bd170ab9acbc44592b8bbc',
  },

  // ping++配置
  pingxx: {
    API_KEY: 'sk_live_P3Fm33YRj5m7Y0j933z3bYB6',
   // API_KEY: "sk_test_CmrjnDzbrznPH4e1W5H88SmL",
    APP_SECRET: 'b44bcf415eae0b0ef0bfc81ff35c68eb',
    APP_ID: 'app_COuvbHDiX1SKaXDq',
  },

  // 短信配置
  sms: {
    account: 'jksc103',
    password: 'jksc10355',
    content: '【xxxx】您的验证码是@，请于1分钟内正确输入',
    action: 'send',
    userid: '',
    sendTime: '',
    extno: '',
    passedcontent: '【xxxx】您的申请已审核通过，请完善您的信息',
  },

  // 邮箱配置
  mailConfig: {
    //host: 'smtp.lambda-study.com',  
    host: 'smtp.mxhichina.com',
    //port: 25,
    secure: true,
    port: 465,
    auth: {
      user: 'liuchao@lambda-study.com',
      pass: 'jingjing1314!@#$%',
    },
  },

  // 开启第三方登录
  snsLogins: ['github', 'qq'],

  // 第三方登录配置
  github: {
    clientID: '462e604628e9b103c157',
    clientSecret: '278bf97e5fdc7ed7ca37f0b098441bab92a7ffeb',
    callback: 'https://api.lambda-study.com/auth/github/callback',
    //callbackU: 'http://localhost:9000/auth/github/callback',
  },

  weibo: {
    clientID: 'clientID',
    clientSecret: 'clientSecret',
    callbackURL: 'http://www.lambda-study.com',
  },

  qq: {
    clientID: '101363117',
    clientSecret: 'd2961499fee6edbe23e0a0bf9cd0ee1f',
    callbackURL: 'https://api.lambda-study.com/auth/qq/callback',
    //callbackURL: 'http://localhost:9000/auth/qq/callback',
  },

  // 爬虫url
  crawlerUrl: {
    khan: 'https://www.khanacademy.org',
    jd: 'http://www.jd.com',
  },
};

const config = _.merge(all, require('./' + process.env.NODE_ENV + '.js') || {});

module.exports = config;

