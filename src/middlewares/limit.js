import moment from 'moment';
const cache  = global.redis;
const SEPARATOR = '^_^@T_T';

const makePerDayLimiter = function(identityName, identityFn) {
  return function(name, limitCount) {
    return function(req, res, next) {
      const identity = identityFn(req);
      const YYYYMMDD = moment().format('YYYYMMDD');
      const key      = YYYYMMDD + SEPARATOR + identityName + SEPARATOR + name + SEPARATOR + identity;

      cache.get(key, function(err, count) {
        if (err) {
          return next(err);
        }
        let inputCount = count || 0;
        if (inputCount < limitCount) {
          inputCount += 1;
          cache.set(key, inputCount, 60 * 60 * 24);
          res.set('X-RateLimit-Limit', limitCount);
          res.set('X-RateLimit-Remaining', limitCount - inputCount);
          next();
        } else {
          res.send('ratelimit forbidden. limit is ' + limitCount + ' per day.');
        }
      });
    };
  };
};

exports.peruserperday = makePerDayLimiter('peruserperday', function(req) {
  return (req.user || req.session.user).loginname;
});

exports.peripperday = makePerDayLimiter('peripperday', function(req) {
  return req.ip;
});
