import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import paginate from 'express-paginate';
import methodOverride from 'method-override';
import cors from 'cors';
import session from 'express-session';
import connectRedis from 'connect-redis';
import passport from 'passport';
import errorSendMiddleware from './middlewares/error_send';
import renderMiddleware from './middlewares/render';
import requestLog  from './middlewares/request_log';
import config from './config/env';
// import colors from 'colors';
// import mongooseLog from './middlewares/mongoose_log'; // 打印 mongodb 查询日志
if (config.env === 'development') {
  require('./middlewares/mongoose_log');
}

require('colors');
import bunyanConfig from './utils/logs';
import errorHandler from 'errorhandler';
import compression from 'compression';

const app = global.app = express();
const RedisStore = connectRedis(session);

class AppDelegate {
  constructor() {
    this._configApp();
    this._errorHandle(app);
  }

  run() {
    const httpServer =
      app.listen(config.port, () => {
        global.logger.info('Express server listening on port ' + config.port);
      });

    process.on('SIGTERM', () => {
      this.gracefullyExiting = true;

      global.logger.warn('Received kill signal (SIGTERM), shutting down');

      setTimeout(() => {
        global.logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30 * 1000);

      httpServer.close(() => {
        global.logger.info('Closed out remaining connections.');
        process.exit();
      });

      global.scheduler.clear();

      /* global.scheduler.clear();

      global.queue.shutdown(5000, (err) => {
        global.logger.error(err);
      }); */
    });
  }

  _configApp() {
    require('./models');// 加载数据库
    require('./utils');
    this._configMiddleware();
    app.use('/', require('./routes'));
  }

  _configMiddleware() {
    // 显示send时间
    if (config.env === 'development') {
      // app.use(renderMiddleware.render);
      app.use(requestLog);
    }

    // Request logger。请求时间
    
    app.use(errorSendMiddleware.errorSend);

/*    app.use((req, res, next) => {
      if (!this.gracefullyExiting) {
        next();
        return;
      }

      res.setHeader('Connection', 'close');
      res.send(502, 'Server is in the process of restarting.');
    });*/

     app.enable('trust proxy');
    const options = {
      origin: true,
      credentials: true,
    };
     //const origin = process.env.NODE_ENV === 'development' ? /\.bmoji\.com($|:[0-9]+$)/ : [/\.bmoji\.com$/, 'http://test-api.bmoji.com:3000'];
     //const origin = process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : ['http://www.lambda-study.com'];
     //
     //app.use(cors({origin, credentials: true}));

    app.use(cors(options));
    app.use(compression());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    app.use(cookieParser());
    app.use(session({
      secret: config.session.secrets,
      resave: false,
      saveUninitialized: false,
      store: new RedisStore({client: global.redis}),
      cookie: config.session.cookie,
    }));

    app.use(passport.initialize());

    app.use((req, res, next) => {
      if (req.cookies && req.cookies.access_token) {
        req.query = {...req.query, access_token: req.cookies.access_token}; // hack: use cookie to verify access_token
      }

      next();
    });

    app.use(paginate.middleware(10, 50));

/*    if (process.env.NODE_ENV === 'development') {
      // use morgan to log requests to the console
      app.use(morgan('dev', {
        skip: (req, res) => {
          // 过滤消息队列请求log
          return req.originalUrl.indexOf('kue') !== -1;
        },
      }));

      app.use((req, res, next) => {
        const _json = res.json;
        res.json = function tmp(obj) {
          global.logger.debug({json: obj});
          _json.call(res, obj);
        };

        next();
      });
    } else {
      app.use(require('express-bunyan-logger').errorLogger({
        ...bunyanConfig,
      }));
    }*/
  }

  _errorHandle() {
    if ( config.env === 'development') {
      app.use(errorHandler());
    } else {
      app.use(function(err, req, res, next) {
        return res.status(500).send();
      });
    }
  }
}

const delegate = new AppDelegate();
delegate.run();

exports = module.exports = app;
