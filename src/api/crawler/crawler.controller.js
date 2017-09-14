import Promise from 'bluebird';
import * as Errors from '../../utils/error';
import { swallow } from '../../utils/decorators';
import readKhan from '../../utils/crawler/readKhan';

export default class CrawlerController {
  @swallow
  static async getClassList(req, res, next) {
    let articleList = {};
    const classList = await readKhan.classList();
/*    classList.map((item)=>{
      readKhan.articleList(item.url, function (err, list) {
        articleList[item.id] = list;
      });
    })*/
   /* readKhan.articleList('https://www.khanacademy.org/math/early-math', function (err, list) {
      //articleList[item.id] = list;
      console.log(JSON.stringify(list));
    });

    global.logger.info(articleList);*/

    return res.json({success: true, data: classList});
  }

}
