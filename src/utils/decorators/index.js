const STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg;
const ARGUMENT_NAMES = /([^\s,]+)/g;
function getParamNames(func) {
  const fnStr = func.toString().replace(STRIP_COMMENTS, '');
  let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
  if (!result) {
    result = [];
  }

  return result;
}

export function swallow(target, name, descriptor) {
  const fn = descriptor.value;

  const paramNames = getParamNames(fn);
  // const nextFuncIndex = paramNames.indexOf('next');
  const resFuncIndex = paramNames.indexOf('res');

  descriptor.value = (...args) => {
    // const next = nextFuncIndex >= 0 ? args[nextFuncIndex] : () => {};
    const res = resFuncIndex >= 0 ? args[resFuncIndex] : () => {};

    const wrapper = (error) => {
      global.logger.error(error);
      // next(error);
      // err.errors.name.message
      return res.status(500).send({success: false, error_msg: error.message});
    };

    try {
      const result = fn.apply(this, args);
      if (result && result.catch) {
        result.catch(wrapper);
      }

      return result;
    } catch (error) {
      return wrapper(error);
    }
  };
}
