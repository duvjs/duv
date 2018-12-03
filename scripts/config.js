const path = require('path')
const buble = require('rollup-plugin-buble')
const alias = require('rollup-plugin-alias')
const replace = require('rollup-plugin-replace')
const flow = require('rollup-plugin-flow-no-whitespace')
const version = process.env.VERSION || require('../package.json').version
const weexVersion = process.env.WEEX_VERSION || require('../packages/weex-vue-framework/package.json').version
const duvVersion = process.env.DUV_VERSION || require('../packages/duvjs/package.json').version

const aliases = require('./alias')
const resolve = p => {
  const base = p.split('/')[0]
  if (aliases[base]) {
    return path.resolve(aliases[base], p.slice(base.length + 1))
  } else {
    return path.resolve(__dirname, '../', p)
  }
}
const setGlobal = `
try {
  if (!global) global = {};
  global.process = global.process || {};
  global.process.env = global.process.env || {};
  global.App = global.App || App;
  global.Page = global.Page || Page;
  global.Component = global.Component || Component;
  global.getApp = global.getApp || getApp;
  let env = ''
  try {
    if(wx) {env = 'wx'}
  } catch(e) {}
  try {
    if(swan) {env = 'bd'}
  } catch(e) {}
  global.env = env;
} catch (e) {}
`
const builds = {
  'duv': {
    duv: true,
    entry: resolve('duv/entry-runtime.js'),
    dest: resolve('packages/duvjs/index.js'),
    format: 'umd',
    env: 'production',
    banner: setGlobal
  },
  'duv-template-compiler': {
    entry: resolve('duv/entry-compiler.js'),
    dest: resolve('packages/duv-template-compiler/build.js'),
    format: 'cjs',
    external: Object.keys(require('../packages/duv-template-compiler/package.json').dependencies)
  },
}

function genConfig (name) {
  const opts = builds[name]
  const config = {
    input: opts.entry,
    external: opts.external,
    plugins: [
      replace({
        __WEEX__: !!opts.weex,
        __DUV__: !!opts.duv,
        __WEEX_VERSION__: weexVersion,
        __DUV_VERSION__: duvVersion,
        __VERSION__: version
      }),
      flow(),
      buble(),
      alias(Object.assign({}, aliases, opts.alias))
    ].concat(opts.plugins || []),
    output: {
      file: opts.dest,
      format: opts.format,
      banner: opts.banner,
      name: opts.moduleName || 'Vue'
    }
  }

  if (opts.env) {
    config.plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(opts.env)
    }))
  }
  // if (opts.duv) {
  //   config.plugins.push(replace({
  //     'inBrowser && window.navigator.userAgent.toLowerCase': `['duv-runtime'].join`
  //   }))
  // }

  Object.defineProperty(config, '_name', {
    enumerable: false,
    value: name
  })

  return config
}

if (process.env.TARGET) {
  module.exports = genConfig(process.env.TARGET)
} else {
  exports.getBuild = genConfig
  exports.getAllBuilds = () => Object.keys(builds).map(genConfig)
}
