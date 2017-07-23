
const {executeRollup, fse} = require('rollup-standalone')
const path = require('path')

let IS_PROD = process.env.NODE_ENV === 'production'

module.exports = executeRollup({
  cli: true,
  entry: path.resolve(__dirname, 'server-entry.js'),
  dest: path.resolve(__dirname, '../server-entry.js'),
  format: 'cjs',
  external: [
    'vue',
    'vue-router',
    'vue-server-renderer'
  ],
  babelOptions: true,
  vueOptions: true,
  commonjsOptions: {
    include: [
      'node_modules/**',
      'contract/**'
    ]
  },
  resolveOptions: {
    browser: false
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

process.on('unhandledRejection', (reason) => {
  console.error(reason)
  process.exit(1)
})
