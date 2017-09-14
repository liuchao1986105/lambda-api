module.exports = function(req, res, next) {
  /* if (/^\/(public|agent)/.test(req.url)) {
    next();
    return;
  } */
  const te = new Date();
  global.logger.info('Started' + te.toISOString() + ' ' + req.method + ' ' + req.url);

  res.on('finish', function() {
    const duration = ((new Date()) - te);

    global.logger.info('Completed ' + res.statusCode + ', duration (' + duration + 'ms)');
  });

  next();
};
