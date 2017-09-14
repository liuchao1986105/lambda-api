import mongoose from 'mongoose';
import baseModel from './base';
import timestamps from 'mongoose-timestamp';
import loadClass from 'mongoose-class-wrapper';
import mongoosePaginate from 'mongoose-paginate';
import crypto from 'crypto';

// 计算一个用户的积分
export const Values = {
  article: 10,
  video: 50,
  book: 10,
  comment: 0,
  collect: 0
};

const UserSchema = new mongoose.Schema({
  //name: { type: String, unique: true, required: true, index: true },
  name: { type: String, required: true, index: true },
  hashedPassword: {type: String},
  email: {type: String, lowercase: true},
  headimgurl: { type: String, default: '' },
  sex: { type: String, default: '' },
  city: { type: String },
  province: { type: String },
  description: { type: String },
  phone: { type: String },
  provider: { type: String, default: 'local'},
  collectedTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic'}],
  collectedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article'}],
  payedTopics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic'}],
  payedArticles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Article'}],
  articleCount: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  role: { type: String, default: 'user'},
  salt: { type: String },
  invitor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  active: { type: Boolean, default: true },
  isPayed: { type: Boolean, default: false },
  payTime: { type: Date },

  openid: { type: String },   //wechat

  position: { type: String }, //职位
  company: { type: String }, //公司
  sign: { type: String }, //个人签名
  blog: { type: String },  //博客
  weixin: { type: String },  //微信
  alipay: { type: String },  //支付宝
  githubname : { type: String },
  // 邀请了哪些人
  inviteds: [{
    user_id: String,
    user_name: Object,
    created: Date,
  }],

  github: {
    id: String,
    token: String,
    email: String,
    login: String,
  },
  weibo: {
    id: String,
    token: String,
    email: String,
    name: String,
  },
  qq: {
    id: String,
    token: String,
    email: String,
    name: String,
  },
});

class UserModel {
  get password() {
    return this._password;
  }

  set password(password) {
    this._password = password;
    this.salt = this.makeSalt();
    this.hashedPassword = this.encryptPassword(password);
  }

  get userInfo() {
    return {
      '_id': this._id,
      'name': this.name,
      'score': this.score,
      'role': this.role,
      'collectedTopics': this.collectedTopics,
      'collectedArticles': this.collectedArticles,
      'payedArticles': this.payedArticles,
      'payedTopics': this.payedTopics,
      //'headimgurl': this.headimgurl,
      'headimgurl': this.headimgurl,
      //'provider': this.provider,
      'isPayed': this.isPayed,
      'payTime': this.payTime,
      'inviteds': this.inviteds,
      'articleCount': this.articleCount,
      'created_at': this.created_at,
      'sign': this.sign,
      'email': this.email
    };
  }

  get token() {
    return {
      '_id': this._id,
      'role': this.role,
    };
  }

  // 生成盐
  makeSalt() {
    return crypto.randomBytes(16).toString('base64');
  }

  // 检查用户权限
  hasRole(role) {
    const selfRoles = this.role;
    return (selfRoles.indexOf('admin') !== -1 || selfRoles.indexOf(role) !== -1);
  }

  // 验证用户密码
  authenticate(plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
  }

  // 生成密码
  encryptPassword(password) {
    if (!password || !this.salt) return '';
    const salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
  }
}

UserSchema
  .path('name')
  .validate(function(value, respond) {
    var self = this;
    this.constructor.findOne({name: value}, function(err, user) {
      if(err) throw err;
      if(user) {
        if(self.id === user.id) return respond(true);
        return respond(false);
      }
      respond(true);
    });
  }, '该用户名已经被使用.');

UserSchema.plugin(loadClass, UserModel);
UserSchema.plugin(baseModel);
UserSchema.plugin(mongoosePaginate);
UserSchema.plugin(timestamps, {
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

UserSchema.set('toJSON', {
  transform: (doc, ret, options) => {
    //ret.headimgurl = doc.imgUrl;
    delete ret.pass;
    delete ret.updated_at;
    delete ret.active;
    //delete ret.collectedTopics;
    //delete ret.collectedArticles;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', UserSchema);


