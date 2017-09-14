require('./logs');
require('./redis');
require('./schedule');
import Schedule from './schedule';
import moment from 'moment-timezone';
moment.tz.setDefault('Asia/Shanghai');
