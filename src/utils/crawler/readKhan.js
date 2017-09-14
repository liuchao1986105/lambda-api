import request from 'request';
import cheerio from 'cheerio';
import config from '../../config/env';
import { khanData } from './khanData';
import Promise from 'bluebird';

export default class ReadKhan {
  /**
  * 获取文章分类列表
  *
  * @param {String} url
  * @param {Function} callback
  */
  static classList() {
    let classList = [];
    try {
      for(let i = 0; i < khanData.domains.length; i++){
        for(let j = 0; j < khanData.domains[0].children.length; j++){
          let item = {
            name: khanData.domains[0].children[j].title,
            url: config.crawlerUrl.khan + khanData.domains[0].children[j].href,
            id: khanData.domains[0].children[j].identifier,
            hasMission: khanData.domains[0].children[j].missionSlug !== null,
          };
          classList.push(item);
        }
      }
      return Promise.resolve(classList);
    } catch (err) {
      return Promise.reject(err);
    }
  }


  /**
  * 获取分类页面博文列表
  *
  * @param {String} url
  * @param {Function} callback
  */

  static articleList(url,callback) {
    console.log('读取任务列表：' + url);
    let articleList = [];

    request.get('https://www.khanacademy.org/math/early-math', function(err, res) {
      if (err) {
        return global.logger.error('读取任务列表失败', {'error': err});
      }
      console.log(JSON.stringify(res));
      console.log("dddd");

       // 根据网页内容创建DOM操作对象
      var $ = cheerio.load(res.body.toString());

      // 读取博文列表
      var articleList = [];
      $('.topic-list .topic-list-item').each(function () {
        var $me = $(this);
        var $title = $me.find('.topic-title');
        var $description = $me.find('.topic-description-text');
        var url = $me.attr('href');

        var item = {
          title: $title.text().trim(),
          url: config.mainUrl.url + url,
          description: $description.text().trim(),
          id: url.split('/')[url.split('/').length-1],
        };
        console.log(JSON.stringify(item));
        articleList.push(item);
      });

    callback(null, articleList);
    });
  }
}

/**
 * 获取博文页面内容
 *
 * @param {String} url
 * @param {Function} callback
 */
/*exports.articleDetail = function (url, callback) {
  console.log('读取子任务列表：' + url);

  request(url, function (err, res) {
    if (err) return callback(err);

    // 根据网页内容创建DOM操作对象
    var $ = cheerio.load(res.body.toString());

    var subTasksList = [];

    $('.tutorial-overview-block').each(function () {
      $(this).find('.progress-item a').each(function () {
        var $me = $(this);
        var $title = $me.find('.progress-title');
        var url = $me.attr('href');

        var item = {
          title: $title.text().trim(),
          url: config.mainUrl.url + url,
          id: url.split('/')[url.split('/').length-1],
        };

        console.log(JSON.stringify(item));
        subTasksList.push(item);
      });
    });

    callback(null, subTasksList);
  });
};*/