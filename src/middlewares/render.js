exports.render = function(req, res, next) {
  res._send = res.send;

  res.send = function(options, fn) {
    const te = new Date();

    res._send(options, fn);

    const duration = (new Date() - te);
    global.logger.info('Send data spend (' + duration + 'ms)');
  };

  next();
};
