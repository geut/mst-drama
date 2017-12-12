import { addMiddleware, getSnapshot, applySnapshot } from 'mobx-state-tree';
import stringify from 'fast-safe-stringify';

const createAction = (rawCall, prefix = '') => {
  return {
    status: prefix,
    rootId: rawCall.rootId,
    name: rawCall.name,
    args: rawCall.args.map(arg => stringify(arg))
  };
};

const onActionStep = (target, ...args) => {
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
    if (type === 'flow_spawn' && parentId === rootId && ps.has(rootId)) {
      const action = ps.get(rootId);
      action.isAsync = true;
      return next(rawCall);
    }

    // We track each yield on the current root action
    if (type === 'flow_resume' && ps.has(rootId)) {
      const action = ps.get(rootId);
      const result = next(rawCall);
      if (!action.lastSnapshot) {
        action.lastSnapshot = getSnapshot(rawCall.tree);
        listener(createAction(action, '@@START'));
        return result;
      }
      if (
        options.trackYield &&
        action.lastSnapshot !== getSnapshot(rawCall.tree)
      ) {
        action.lastSnapshot = getSnapshot(rawCall.tree);
        listener(createAction(action, '@@YIELD'));
      }
      return result;
    }

    // Last state of the complete root action
    if (type === 'flow_return' && parentId === rootId && ps.has(rootId)) {
      const action = ps.get(rootId);
      ps.delete(rootId);
      const result = next(rawCall);
      listener(createAction(action, '@@COMPLETE'));
      return result;
    }

    if (type === 'flow_throw' && parentId === rootId && ps.has(rootId)) {
      const action = ps.get(rootId);
      ps.delete(rootId);
      const result = next(rawCall);
      listener(createAction(action, '@@ERROR'));
      return result;
    }

    return next(rawCall);
  });
};

export default function connectReduxDevtools(remoteDevDep, model, options) {
  // Connect to the monitor
  const remotedev = remoteDevDep.connectViaExtension();
  let applyingSnapshot = false;

  // Subscribe to change state (if need more than just logging)
  remotedev.subscribe(message => {
    // Helper when only time travelling needed
    const state = remoteDevDep.extractState(message);
    if (state) {
      applyingSnapshot = true;
      applySnapshot(model, state);
      applyingSnapshot = false;
    }
  });

  // Send changes to the remote monitor
  onActionStep(model, options, action => {
    if (applyingSnapshot) {
      return;
    }

    const copy = {};

    copy.type = action.status
      ? `${action.status}/${action.rootId}/${action.name}`
      : `${action.name}`;

    if (action.args) {
      action.args.forEach((value, index) => {
        copy[index] = value;
      });
    }

    remotedev.send(copy, getSnapshot(model));
  });

  remotedev.init(getSnapshot(model));
}
