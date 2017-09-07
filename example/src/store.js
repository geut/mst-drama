import { types, process } from 'mobx-state-tree';

const delay = time => new Promise(resolve => setTimeout(resolve, time));

export default types
  .model('root', {
    syncCount: types.number,
    asyncCount: types.number,
    one: types.maybe(types.boolean),
    two: types.maybe(types.boolean),
    three: types.maybe(types.boolean),
    otro: types.maybe(types.boolean)
  })
  .actions(self => ({
    syncInc() {
      self.syncCount++;
    },
    asyncInc: process(function*() {
      self.asyncCount++;
      yield self.runTwo();
      self.one = true;
    }),
    runTwo: process(function*() {
      self.asyncCount++;
      yield delay(2000);
      self.otro = true;
      yield self.runThree();
      self.two = true;
    }),
    runThree: process(function*() {
      self.asyncCount++;
      yield delay(2000);
      self.three = true;
    })
  }));
