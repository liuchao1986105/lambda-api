import Promise from 'bluebird';
import { swallow } from '../decorators';

export default class CacheController {
  @swallow
  static async get(key) {
    const start = new Date();
    const value = await global.redis.get(key);
    if (!value) {
      return null;
    }
    const returnVal = JSON.parse(value);
    const duration = (new Date() - start);
    global.logger.debug(`Cache get ${key}  ${duration}ms`);
    return returnVal;
  }

  @swallow
  static async set(key, value, time) {
    const start = new Date();
    const val = JSON.stringify(value);
    let returnVal;

    if (!time) {
      returnVal = await global.redis.set(key, val);
    } else {
      returnVal = await global.redis.setex(key, time, val);
    }

    const duration = (new Date() - start);
    global.logger.debug(`Cache set ${key}  ${duration}ms`);
  }

  @swallow
  static async del(key) {
    const start = new Date();
    await global.redis.del(key);

    const duration = (new Date() - start);
    global.logger.debug(`Cache del ${key}  ${duration}ms`);
  }

}

/*      const key = `replyTo:${receiver.toString()}:${deal.toString()}`;
      global.cache.sadd('commentKeys', key);
      global.cache.hmset(key, {
        repliername: comment.createdby.username,
        text: comment.text,
        time: moment().format('YYYY-MM-DD HH:mm:ss'),
      });
      global.cache.hincrby(key, 'count', 1);
      const stream = global.cache.sscanStream('commentKeys', {
        match: 'replyTo:*',
        count: 30,
      });
     stream.on('data', (resultKeys) => {
      resultKeys.forEach((key) => {
        global.cache.hmget(key, 'repliername', 'text', 'time', 'count').then(([repliername, text, time, count]) => {
          const [, userId, dealId] = key.split(':');
          const data = {
            userId,
            dealId,
            count,
            replier: (parseInt(count, 10) > 1 ? `${repliername} 等` : repliername),
            time,
            text: (parseInt(count, 10) > 1 ? `共收到${count}条消息` : text),
          };

          QueueController.addJob('replyNotify', data, (job) => {
            MessageController.handleReplyMessage(job.data);
          });

          global.cache.del(key);
          global.cache.srem('commentKeys', key);
        }).catch(global.logger.error);
      });
    });
    stream.on('error', (err) => {
      global.logger.error(err);
    });
    stream.on('end', () => {
    });

  static pushDeal(deal) {

    return global.cache.hmset(`deal:${deal._id.toString()}`, TrendingController.formatDeal(deal));
  }

  static formatDeal(deal) {
    const json = deal.toJSON ? deal.toJSON() : {...deal};
    json.score = deal.score;

    json.user = JSON.stringify(json.user);

    delete json.posts;
    if (deal.posts.length > 0) {
      json.post = JSON.stringify(deal.posts[0]);
    }

    return json;
  }

  static deformatDeal(json) {
    const deal = {...json};
    deal.user = JSON.parse(json.user);
    if (json.post) {
      const post = JSON.parse(json.post);
      delete post.created_at;
      delete post.createdby;
      delete post.comments;
      delete post.likes;
      delete post.positive;
      deal.posts = [post];
    }
    delete deal.post;
    return deal;
  }

  global.cache.zadd('posts', Date.now() * (deal.isprivate ? -1 : 1), `${dealId}:${postId}`);

  global.cache.zadd('hots', TrendingController.calculateHotValue(deal), dealId);
  global.cache.zincrby('hots', value, dealId);


 global.cache.zscanStream('posts', {
      match: `${dealId}:*`,
    }).on('data', (data) => {
      data.filter((value, index) => {
        return index % 2 === 0;
      }).forEach((postKey, index) => {
        global.cache.zscore('posts', postKey).then((scoreString) => {

          global.cache.zadd('posts', score, postKey);
        });
      });
    }).on('error', global.logger.error);

    // 更新热门列表中的值
    global.cache.zscore('hots', dealId).then((scoreString) => {
      if (!scoreString) {
        return;
      }

      let score = parseFloat(scoreString);
      if (isprivate && score > 0) {
        score = -score;
      } else if (!isprivate && score < 0) {
        score = -score;
      }

      global.cache.zadd('hots', score, dealId);
    });

global.cache.zrevrange('posts', (page - 1) * limit, page * limit - 1);
const allCount = await global.cache.zcount('posts', '-inf', '+inf');


const hotDealIds = await global.cache.zrevrange('hots', (page - 1) * limit, page * limit - 1).catch(next);

const promises = hotDealIds.map((dealId) => {
      return TrendingController._getDealInfoById(dealId).then(({deal, cached}) => {
        if (!cached) {
          global.cache.hmset(`deal:${dealId}`, TrendingController.formatDeal(deal)); // cache
          global.cache.zadd('hots', TrendingController.calculateHotValue(deal), dealId);
        }

        return Promise.resolve(deal);
      });
    });
    const hotDeals = await Promise.all(promises).catch(next);

    const allCount = await global.cache.zcount('hots', '-inf', '+inf').catch(next);



  static async clearLowScoreItems() {
    const cache = global.cache;

    // 清理热门
    let allCount = await global.cache.zcount('hots', '-inf', '+inf');
    if (allCount > MAX_ITEM_COUNT * 2) {
      const lowScoreDealIds = await global.cache.zrevrange('hots', MAX_ITEM_COUNT * 2, -1);
      lowScoreDealIds.forEach((dealId) => cache.del(`deal:${dealId}`));
    }

    // 清理动态
    allCount = await global.cache.zcount('posts', '-inf', '+inf');
    if (allCount > MAX_ITEM_COUNT * 2) {
      const lowScoreItems = await global.cache.zrevrange('posts', MAX_ITEM_COUNT * 2, -1);
      lowScoreItems.forEach((item) => cache.zrem('posts', item));
    }
  }


global.cache.multi().set('access_token_by_openid:' + openid, JSON.stringify(token)).get('access_token_by_openid:' + openid).exec((err, results) => {
    if (err) return callback(err);
    callback(null);
  });
*/