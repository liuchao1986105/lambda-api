import Redis from 'ioredis';
import Redlock from 'redlock';
import config from '../../config/env';

global.redis = new Redis(config.redis);

global.redis.on('error', function(err) {
  global.logger.error('redis error', err);
});

global.redis.once('connect', function() {
  global.logger.info('redis connect');
});

global.redlock = new Redlock(
  [global.redis],
  {
    // the expected clock drift; for more details
    // see http://redis.io/topics/distlock
    driftFactor: 0.01,

    // the max number of times Redlock will attempt
    // to lock a resource before erroring
    retryCount: 0,

    // the time in ms between attempts
    retryDelay: 200,
  }
);

// redis.flushdb(); // 清空 db 里面的所有内容
// exports = module.exports = client
