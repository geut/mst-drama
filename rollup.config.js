const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const pkg = require('./package.json');
const babel = require('rollup-plugin-babel');

export default {
  input: 'src/index.js',
  output: {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true
  },
  external: ['mobx', 'mobx-state-tree'],
  plugins: [
    resolve(),
    commonjs(),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
