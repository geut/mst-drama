const { addMiddleware, getSnapshot } = require('mobx-state-tree');
const safeStringify = require('fast-safe-stringify');

const createAction = (rawCall, prefix = '') => {
  return {
    status: prefix,
    rootId: rawCall.rootId,
    name: rawCall.name,
    args: rawCall.args.map(arg => safeStringify(arg))
  };
};

exports.onActionPatch = (target, ...args) => {
  let listener;
  let userOptions;

  if (args.length === 1) {
    listener = args[0];
    userOptions = {};
  } else {
    [userOptions, listener] = args;
  }

  const options = Object.assign(
    {
      trackPatches: false
    },
    userOptions
  );

  const ps = new Map();

  return addMiddleware(target, (rawCall, next) => {
    const { id, rootId, type, name, args, parentId } = rawCall;

    if (type === 'action' && id === rootId) {
      ps.set(rootId, {
        name: name,
        isAsync: false,
        args: args,
        rootId
      });

      const result = next(rawCall);
      const action = ps.get(rootId);
      if (action && !action.isAsync) {
        ps.delete(rootId);
        listener(createAction(rawCall));
      }
      return result;
    }

    // First spawn
    if (type === 'process_spawn' && parentId === rootId && ps.has(rootId)) {
      const action = ps.get(rootId);
      action.isAsync = true;
      return next(rawCall);
    }

    // We track each patch on the current root action
    if (type === 'process_resume' && ps.has(rootId)) {
      const action = ps.get(rootId);
      const result = next(rawCall);
      if (!action.lastSnapshot) {
        action.lastSnapshot = getSnapshot(rawCall.tree);
        listener(createAction(action, '@@START'));
        return result;
      }
      if (
        options.trackPatches &&
        action.lastSnapshot !== getSnapshot(rawCall.tree)
      ) {
        action.lastSnapshot = getSnapshot(rawCall.tree);
        listener(createAction(action, '@@PATCH'));
      }
      return result;
    }

    // Last state of the complete root action
    if (type === 'process_return' && parentId === rootId && ps.has(rootId)) {
      const action = ps.get(rootId);
      ps.delete(rootId);
      const result = next(rawCall);
      listener(createAction(action, '@@COMPLETE'));
      return result;
    }

    if (type === 'process_throw' && parentId === rootId && ps.has(rootId)) {
      const action = ps.get(rootId);
      ps.delete(rootId);
      const result = next(rawCall);
      listener(createAction(action, '@@ERROR'));
      return result;
    }

    return next(rawCall);
  });
};
