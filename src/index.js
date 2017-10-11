import { applySnapshot, getSnapshot } from 'mobx-state-tree';
import { onActionPatch } from './action';

export * from './process';
export { onActionPatch, connectReduxDevtools };

function connectReduxDevtools(remoteDevDep, model, options) {
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
  onActionPatch(model, options, action => {
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
