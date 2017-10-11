const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const pkg = require('./package.json');

export default {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true
  },
  external: ['mobx', 'mobx-state-tree'],
  plugins: [resolve(), commonjs()]
};
