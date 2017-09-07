import React from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react';
import RootStore from './store';
import { connectReduxDevtools } from 'mst-drama';

const store = RootStore.create({
  syncCount: 0,
  asyncCount: 0
});

const App = observer(function() {
  return (
    <div>
      <div>
        Sync: {store.syncCount}
        <button onClick={() => store.syncInc()}>Increment</button>
      </div>
      <div>
        Async: {store.asyncCount}
        <button onClick={() => store.asyncInc()}>Increment</button>
      </div>
    </div>
  );
});

connectReduxDevtools(require('remotedev'), store, { trackPatches: true });

ReactDOM.render(<App />, document.getElementById('root'));
