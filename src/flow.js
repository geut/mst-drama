import { flow } from 'mobx-state-tree';

function isGenerator(obj) {
  return typeof obj.next === 'function' && typeof obj.throw === 'function';
}

function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if (
    constructor.name === 'GeneratorFunction' ||
    constructor.displayName === 'GeneratorFunction'
  )
    return true;
  return isGenerator(constructor.prototype);
}

export const flowMap = (props = {}) => {
  return Object.keys(props).reduce((result, key) => {
    if (isGeneratorFunction(props[key])) {
      result[key] = flow(props[key]);
      return result;
    }

    result[key] = props[key];
    return result;
  }, {});
};
