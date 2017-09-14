import mongoose from 'mongoose';
import config from '../config/env';
import path from 'path';
import Promise from 'bluebird';
import recursive from 'recursive-readdir';
/* var autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(connection); */

mongoose.Promise = Promise;
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', console.error.bind(console, 'connection error.'));

mongoose.connection.once('open', () => {
  global.logger.info('mongoose open');
  recursive(__dirname, ['index.js', '*.map', 'base.js', (file, stats) => !stats.isDirectory() && path.extname(file) !== '.js'], (err, files) => {
    files.forEach((file) => {
      Promise.promisifyAll(require(file));
    });
  });
});

