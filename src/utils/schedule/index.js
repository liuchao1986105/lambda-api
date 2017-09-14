import later from 'later';
import { User } from '../../models/user';
import { Article } from '../../models/article';
import mail from '../../utils/email';
import FeedController from '../../api/feed.controller';

class ScheduleController {
  constructor() {
    this.timers = [];
  }

  addSchedule(scheduleText, callback) {
    //const schedule = later.parse.text();
    const schedule = later.parse.cron(scheduleText)
    global.logger.debug(later.schedule(schedule).next(5), 'schedule results');

    this.timers.push(later.setInterval(() => {
      callback();
    }, schedule));
  }

  clear() {
    this.timers.forEach((timer) => {
      timer.clear();
    });
    this.timers = [];
  }
}

// const testSchedule = later.parse.text('every 5 seconds');
// const dailySchedule = later.parse.text('at 3:00 am'); // fires at 03:00am every day

global.scheduler = new ScheduleController();


global.scheduler.clear();

// UTC时间 实际时间需＋8 为03:00
// 每月1号凌晨3点  19   //on the first day of the month
global.scheduler.addSchedule('10 0 1 * *', () => {
  //查所有用户的inviteds记录
  User.findAsync({$and:[{inviteds: {$ne: null}}, {inviteds: {$ne: []}}]}).then((users) =>{
    //发邮件
    let infos = '';
    infos += users.map(function (user) {
        return '<p>'+ user.name + '邀请了 ' + user.inviteds.length + ' 好友成为会员。<p>' 
    });

    mail.sendInvitedsCountMail(infos);

  })
});

// 每月1号8:20点
global.scheduler.addSchedule('20 0 1 * *', () => {
  //清除inviteds
  User.update({}, { $set: { inviteds: [] } }, { multi: true }).exec();
});


// 每月1号凌晨1点
global.scheduler.addSchedule('0 17 1 * *', () => {
  //monthScore清零
  Article.update({}, { $set: { monthScore: 0 } }, { multi: true }).exec();
});


// 每周一凌晨1点
global.scheduler.addSchedule('0 17 * * 1', () => {
  //monthScore清零
  Article.update({}, { $set: { weekScore: 0 } }, { multi: true }).exec();
});

//每隔两个小时执行一次fetch_post
global.scheduler.addSchedule('0 */2 * * *', () => {
  FeedController.cronFetchPosts();
});



