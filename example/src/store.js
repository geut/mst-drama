import { types } from 'mobx-state-tree';
import { flowMap } from 'mst-drama';

const delay = time => new Promise(resolve => setTimeout(resolve, time));

export default types
  .model('root', {
    syncCount: types.number,
    asyncCount: types.number
  })
  .actions(self =>
    flowMap({
      syncInc() {
        self.syncCount++;
      },
      asyncInc: function*() {
        self.asyncCount++;
        yield self.asyncMultiply(2);
        self.asyncCount++;
        yield self.asyncMultiply(4);
      },
      asyncMultiply: function*(value) {
        yield delay(2000);
        self.asyncCount *= value;
      }
    })
  );
