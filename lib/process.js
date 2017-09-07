const { process: co } = require('mobx-state-tree');

exports.processMap = (props = {}) => {
  return Object.keys(props).reduce((result, key) => {
    if (
      props[key].constructor &&
      props[key].constructor.name === 'GeneratorFunction'
    ) {
      result[key] = co(props[key]);
      return result;
    }

    result[key] = props[key];
    return result;
  }, {});
};
