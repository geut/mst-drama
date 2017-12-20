import { flowMap } from '../src';
import { track } from '../src/connect-redux-devtool';
import { types, flow } from 'mobx-state-tree';

const delay = time => new Promise(resolve => setTimeout(resolve, time));
const RootStore = types
  .model('root', {
    syncCount: types.number,
    asyncCount: types.number
  })
  .actions(self => ({
    syncInc() {
      self.syncCount++;
    },
    asyncInc: flow(function*() {
      self.asyncCount++;
      yield self.asyncMultiply(2);
      self.asyncCount++;
      yield self.asyncMultiply(4);
    }),
    asyncMultiply: flow(function*(value) {
      yield delay(100);
      self.asyncCount *= value;
    })
  }));

describe('#flowMap()', () => {
  it('should be a function', () => {
    expect(typeof flowMap).toBe('function');
  });

  it('should convert generators in flow actions', () => {
    const actions = flowMap({
      inc() {},
      *asyncInc() {}
    });

    expect(typeof actions.inc).toBe('function');
    expect(typeof actions.asyncInc).toBe('function');

    expect(actions.inc.name).toBe('inc');
    expect(actions.asyncInc.name).toBe('flowSpawner');
  });
});

describe('#track', () => {
  it('should be a function', () => {
    expect(typeof track).toBe('function');
  });

  it('should track sync actions normally', () => {
    expect.assertions(6);

    const store = RootStore.create({
      syncCount: 0,
      asyncCount: 0
    });

    let times = 1;
    track(store, {}, (action, snapshot) => {
      expect(action.type).toBe('syncInc');
      expect(snapshot).toEqual({
        syncCount: times,
        asyncCount: 0
      });
      times++;
    });

    expect(store.syncCount).toBe(0);
    store.syncInc();
    store.syncInc();
    expect(store.syncCount).toBe(2);
  });

  it('should track async actions normally (trackYield disabled)', () => {
    const store = RootStore.create({
      syncCount: 0,
      asyncCount: 0
    });

    let flows = {};
    track(store, {}, (action, snapshot) => {
      if (!flows[action.rootId]) {
        flows[action.rootId] = [];
      }
      flows[action.rootId].push({ type: action.type, snapshot });
    });

    expect(store.asyncCount).toBe(0);
    return store.asyncInc().then(() => {
      const flowRootIds = Object.keys(flows);
      expect(flowRootIds.length).toBeGreaterThan(0);
      expect(store.asyncCount).toBe(12);

      flowRootIds.forEach(rootId => {
        const steps = flows[rootId];
        expect(steps[0]).toEqual({
          type: `@@START/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 1
          }
        });
        expect(steps[1]).toEqual({
          type: `@@COMPLETE/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 12
          }
        });
      });
    });
  });

  it('should track async actions normally (trackYield enabled)', () => {
    const store = RootStore.create({
      syncCount: 0,
      asyncCount: 0
    });

    let flows = {};
    track(store, { trackYield: true }, (action, snapshot) => {
      if (!flows[action.rootId]) {
        flows[action.rootId] = [];
      }
      flows[action.rootId].push({ type: action.type, snapshot });
    });

    expect(store.asyncCount).toBe(0);
    return store.asyncInc().then(() => {
      const flowRootIds = Object.keys(flows);
      expect(flowRootIds.length).toBeGreaterThan(0);
      expect(store.asyncCount).toBe(12);

      flowRootIds.forEach(rootId => {
        const steps = flows[rootId];
        expect(steps[0]).toEqual({
          type: `@@START/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 1
          }
        });
        expect(steps[1]).toEqual({
          type: `@@YIELD/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 2
          }
        });
        expect(steps[2]).toEqual({
          type: `@@YIELD/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 3
          }
        });
        expect(steps[3]).toEqual({
          type: `@@YIELD/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 12
          }
        });
        expect(steps[4]).toEqual({
          type: `@@COMPLETE/${rootId}/asyncInc`,
          snapshot: {
            syncCount: 0,
            asyncCount: 12
          }
        });
      });
    });
  });
});
