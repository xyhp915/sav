// @NOTICE This file is generated by sav-cli.

// rollup-standard 编译配置文件
// 安装 npm i rollup-standalone sav vue vue-router cross-env standard-sass
// 本地环境构建 cross-env NODE_ENV=development IS_MOCK=1 IS_LOCAL=1 IS_DEV=1 rollup-cli -c views/build-client.js
// 生成环境构建 cross-env NODE_ENV=production rollup-cli -c views/build-client.js

const {executeRollup, fse} = require('rollup-standalone')
const path = require('path')

let IS_PROD = process.env.NODE_ENV === 'production'

module.exports = executeRollup({
  cli: true,
  entry: path.resolve(__dirname, 'client-entry.js'),
  dest: 'static/js/client-entry.js',
  format: 'iife',
  moduleName: 'app',
  external: [
    'vue',
    'vue-router'
  ],
  babelOptions: true,
  vueOptions: true,
  sourceMap: !IS_PROD,
  // uglifyOptions: IS_PROD,
  commonjsOptions: {
    include: [
      'node_modules/**',
      'contract/**'
    ]
  },
  resolveOptions: {
    browser: true
  },
  defines: {
    IS_MOCK: process.env.IS_MOCK,    // 是否使用MOCK数据
    IS_LOCAL: process.env.IS_LOCAL,  // 是否本地环境
    IS_DEV: !IS_PROD,                // 是否开发环境
    IS_PROD: IS_PROD                 // 是否生产环境
  },
  replaces: {
    'process.env.NODE_ENV': IS_PROD ? '"production"' : '"development"'
  }
})

fse.ensureDir('static/js').then(() => {
  return Promise.all([
    fse.copy(require.resolve(IS_PROD
      ? 'vue/dist/vue.min.js' : 'vue/dist/vue.js'),
      'static/js/vue.js'),
    fse.copy(require.resolve(IS_PROD
      ? 'vue-router/dist/vue-router.min.js' : 'vue-router/dist/vue-router.js'),
      'static/js/vue-router.js')
  ])
})

process.on('unhandledRejection', (reason) => {
  console.error(reason)
  process.exit(1)
})
