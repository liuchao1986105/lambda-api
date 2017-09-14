import mongoose from 'mongoose';

const traceMQuery = function(method, info, query) {
  return function(err, result, millis) {
    const infos = [];
    infos.push(query._collection.collection.name + '.' + method.blue);
    infos.push(JSON.stringify(info));
    infos.push((millis + 'ms').green);

    // var duration = (new Date()) - t;
    global.logger.debug('MONGO'.magenta + infos.join(' '));
  };
};

mongoose.Mongoose.prototype.mquery.setGlobalTraceFunction(traceMQuery);
