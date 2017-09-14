import mailer from 'nodemailer';
import smtpTransport from 'nodemailer-smtp-transport';
import  config from '../../config/env';
import util from 'util';

const transport = mailer.createTransport(smtpTransport(config.mailConfig));
const SITE_ROOT_URL = config.host;


const sendMail = function sendMail(data) {
  if (config.env === 'test') {
    return;
  }
  transport.sendMail(data, function(err, info) {
    if (err) {
      global.logger.error(err);
    } else {
      global.logger.info('email sent');
    }
  });
};

exports.sendMail = sendMail;

/**
 * 发送激活通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendActiveMail = function sendActiveMail(who, token, name) {
  const from = util.format('%s <%s>', config.name, config.mailConfig.auth.user);
  const to = who;
  const subject = config.name + '帐号激活';
  const html = '<p>您好：' + name + '</p>' +
    '<p>我们收到您在' + config.name + '的注册信息，请点击下面的链接来激活帐户：</p>' +
    '<h1><a href="' + SITE_ROOT_URL + '/active_account?key=' + token + '&name=' + name + '">激活链接</a></h1>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html,
  });
};

/**
 * 发送密码重置通知邮件
 * @param {String} who 接收人的邮件地址
 * @param {String} token 重置用的token字符串
 * @param {String} name 接收人的用户名
 */
exports.sendResetPassMail = function sendResetPassMail(who, token) {
  var from = util.format('%s <%s>', config.name, config.mailConfig.auth.user);
  var to = who;
  var subject = config.name + '-- 密码重置申请';
  var html = '<p>您好,</p>' +
    '<p>我们收到您的重置密码的请求， 如果您没有提交密码重置的请求，请忽略这封邮件。</p>' +
    '<p>如需继续重置密码，请点击下面的链接: </p>' +
    '<a _target="_blank" href="' + SITE_ROOT_URL + '/reset_pass?key=' + token + '">点击这里重置您的密码</a>'+
    '<br/>' +
    '<p>谢谢 </p>' +
    '<p><strong>Lambda </strong></p>';

  exports.sendMail({
    from: from,
    to: to,
    subject: subject,
    html: html,
  });
};


/**
 * 发送审核邮件给管理员
 */
exports.sendAuditMail = function (name,title) {
    var from = util.format('%s <%s>', config.name, config.mailConfig.auth.user);
    var to = 'liuchao1986105@163.com';
    var subject = name + ' -- ' +  title + ' -- ' + '文章审核';
    var html = '<p>您好：Admin</p>' +
        '<p>用户： ' + name + ' 已分享了一篇技术文章: ' + title + '，请尽快对其进行审核。</p>'
    exports.sendMail({
        from: from,
        to: to,
        subject: subject,
        html: html
    });
};

/*发送每个人每月的受邀人数*/
exports.sendInvitedsCountMail = function (infos) {
  var from = util.format('%s <%s>', config.name, config.mailConfig.auth.user);
  var to = 'liuchao1986105@163.com';
  var subject = '每月的受邀人数统计';
  // var infos = '';
  // infos = users.map(function (user) {
  //     return '<p>'+ user.name + '邀请了 ' + user.inviteds.length + ' 好友成为会员。<p>' 
  // });
  exports.sendMail({
      from: from,
      to: to,
      subject: subject,
      html: infos
  });
}

exports.sendInfoToUser = function (info, who, name) {
  var from = util.format('%s <%s>', config.name, config.mailConfig.auth.user);
  var to = who;
  var subject = '事件通知';

  const html = '<p>您好：' + name + '</p>' +
    '<p>' + info +'</p>'+
    '<a _target="_blank" href="' + SITE_ROOT_URL + '">Lambda程序员学习社区</a>'+
    '<br/>' +
    '<p>谢谢 </p>' +
    '<p><strong>Lambda </strong></p>';

  exports.sendMail({
      from: from,
      to: to,
      subject: subject,
      html: html
  });
}
