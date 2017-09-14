import { Message } from '../../models/message';
import { swallow } from '../decorators';
import _ from 'lodash';
import request from 'request';
import config from '../../config/env';

export default class MessageUtil {
  @swallow
  static async sendMessage(masterId, authorId, targetId, target, type, objectId) {
    const message = new Message();
    message.type      = type;
    message.masterId = masterId;
    message.authorId = authorId;
    message.target = target; // article
    if (target === 'article') {
      message.articleId = targetId;
    }else if(target === 'topic'){
      message.topicId = targetId;
    }else {
      message.articleId = targetId;
    }

    if(objectId){
      if(target === 'topic'){
        message.articleId = objectId;
      }else{
        message.commentId = objectId;
      }
    }


    await message.saveAsync();
  }

  @swallow
  static async deleteMessage(authorId, targetId, target, type) {
    let query = {authorId:authorId, type:type}
    if (target === 'article') {
      query.articleId = targetId;
    }else if(target === 'topic'){
      query.topicId = targetId;
    }else if(target === 'comment'){
      query.commentId = targetId;
    }

    const messages = await Message.findAsync(query);
    const message = messages[0];
    message.active   = false;
    await message.saveAsync();
  }

//  Message.sendSMSMessage(user.phone, config.sms.passedcontent);
  static sendSMSMessage(mobile, content){
    const http = require('http');
    const querystring = require('querystring');
    let postData = {
      account: config.sms.account,
      password: config.sms.password,
      mobile: mobile,
     // content:config.sms.content,
      content: content,
      action: config.sms.action,
      userid: config.sms.userid,
      sendTime: config.sms.sendTime,
      extno: config.sms.extno,
    }
    postData = querystring.stringify(postData);
    const options = {
        host:'sh2.ipyy.com',
        path:'/smsJson.aspx',
        method:'POST',
        agent:false,
        rejectUnauthorized : false,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': content.length,
        }
    };
    const req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            console.log(JSON.parse(chunk));
        });
        res.on('end',function(){
        });
    });
    req.write(content);
    req.end();
  }

  /**
 * 根据文本内容读取用户，并发送消息给提到的用户
 * @param {String} authorId 回复者
 * @param {String} toReplyId 回复给谁
 */
  @swallow
  static async sendMessageToMentionUsers(authorId, toReplyId, targetId, target, type){
    const names = MessageUtil._fetchUsers(text);
    if (names.length === 0) {
        return;
    }
    let users = await User.findAsync({ name: { $in: names }}, null, {select: '_id name'});
    users = users.filter((user) => {
      return !user._id.equals(authorId);
    });
    users.forEach((user) => {
      MessageUtil.sendMessage(user._id, authorId, targetId, commentId, target, type);
    });
  }

  /**
 * 从文本中提取出@username 标记的用户名数组
 * @param {String} text 文本内容
 * @return {Array} 用户名数组
 */
  static _fetchUsers(text) {
    const ignoreRegexs = [
      /```.+?```/g, // 去除单行的 ```
      /^```[\s\S]+?^```/gm, // ``` 里面的是 pre 标签内容
      /`[\s\S]+?`/g, // 同一行中，`some code` 中内容也不该被解析
      /^    .*/gm, // 4个空格也是 pre 标签，在这里 . 不会匹配换行
      /\b\S*?@[^\s]*?\..+?\b/g, // somebody@gmail.com 会被去除
      /\[@.+?\]\(\/.+?\)/g, // 已经被 link 的 username
    ];

    ignoreRegexs.forEach((ignore_regex) => {
      text = text.replace(ignore_regex, '');
    });

    const results = text.match(/@[a-z0-9\-_]+\b/igm);
    let names = [];
    if (results) {
      for (let index = 0, len = results.length; index < len; index++) {
        let name = results[index];
        //remove leading char @
        name = name.slice(1);
        names.push(name);
      }
    }
    names = _.uniq(names);
    return names;
  }

}
