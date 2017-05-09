import * as decorators from './sav/decorator'
import {convertRoute, createVueRoutes, prepareModule} from './sav/router/convert.js'

import babel from 'babel-standalone'
import Module from 'module'
import program from 'commander'
import {resolve, dirname, extname, basename} from 'path'
import fs from 'fs'
import {camelCase} from './sav/util/convert.js'
import JSON5 from 'json5'

import {readFileAsync, fileExistsAsync, writeFileAsync, mkdirAsync} from './sav/util/file.js'

const noticeString = '// @NOTICE This file is generated by sav-cli \n'

program
  .version('0.0.1')
  .option('-p, --path [path]', 'convart root path')
  .option('-d, --dest [dest]', 'dest dir')
  .option('-v, --view [view]', 'view dir')
  .option('-u, --use [plugins]', 'plugins to use')
  .parse(process.argv)

program.path = 'path' in program ? resolve(program.path || '.', '') : false
program.dest = 'dest' in program ? resolve(program.dest) : false
program.view = 'view' in program ? resolve(program.view) : false
program.plugins = 'plugins' in program ? (program.plugins.split(',').map((it) => it.trim())) : false

function requireFromString (code, filename, opts) {
  if (typeof filename === 'object') {
    opts = filename
    filename = undefined
  }
  opts = opts || {}
  filename = filename || ''
  opts.appendPaths = opts.appendPaths || []
  opts.prependPaths = opts.prependPaths || []
  if (typeof code !== 'string') {
    throw new Error('code must be a string, not ' + typeof code)
  }
  let paths = Module._nodeModulePaths(dirname(filename))
  let m = new Module(filename, module)
  m.filename = filename
  m.paths = [].concat(opts.prependPaths).concat(paths).concat(opts.appendPaths)
  m._compile(code, filename)
  return m.exports
}

function readDirModules (path) {
  let modules = {}
  fs.readdirSync(path).map((dirName) => {
    let modal = {}
    fs.readdirSync(resolve(path, dirName)).forEach((name) => {
      let file = resolve(path, dirName, name)
      let ext = extname(name)
      let baseName = basename(name, ext)
      if (baseName !== 'index') {
        let curr = modal[baseName] || (modal[baseName] = {})
        if (ext === '.js') {
          curr.js = file
        } else if (ext === '.json') {
          curr.json = file
        }
        curr.baseName = baseName
      }
    })
    modules[dirName] = modal
  })
  return modules
}

function transformFileAsync (file) {
  return readFileAsync(file).then(data => {
    let code = babel.transform(data, {
      plugins: [
        'transform-decorators-legacy',
        ['transform-object-rest-spread', { 'useBuiltIns': true }],
        'transform-es2015-modules-commonjs'
      ]}).code
    return requireFromString(code, file)
  })
}

let routed = ['api', 'page']

function convertFile ({moduleGroup, moduleName, modal, dest}) {
  return Promise.resolve().then(async () => {
    console.log('convertFile: ', modal.js || modal.json)
    let content
    if (modal.js) { // 装饰器转成JSON
      content = (await transformFileAsync(modal.js)).default
    } else if (modal.json) {
      content = JSON.parse(await readFileAsync(modal.json))
    }
    let data = content
    if (!(content.SavRoute) && (routed.indexOf(moduleGroup.toLowerCase()) !== -1)) {
      data = Object.assign(content, convertRoute(content))
    }
    Object.assign(modal, content)
    prepareModule(modal)
    let dir = resolve(dest, moduleGroup)
    modal.dist = resolve(dir, moduleName + '.json')
    await mkdirAsync(dir)
    await writeFileAsync(modal.dist, JSON.stringify(data, null, 2))
    console.log('convertDone: ', modal.dist)
  })
}

function createIndex (moduleGroup, group, dest) {
  return Promise.resolve().then(async () => {
    let dir = resolve(dest, moduleGroup)
    let dist = resolve(dir, 'index.js')
    console.log('createFile: ', dist)
    let reqs = Object.keys(group).map((name) => `  ${name}: require('./${name}.json')`).join(',\n')
    let str = `module.exports = {\n${reqs}\n}`
    await mkdirAsync(dir)
    await writeFileAsync(dist, str)
    console.log('createDone: ', dist)
  })
}

function createRoot (modules, dest) {
  return Promise.resolve().then(async () => {
    let dist = resolve(dest, 'index.js')
    console.log('createRoot: ', dist)
    let reqs = Object.keys(modules).map((name) => `  ${name}: require('./${name}')`).join(',\n')
    let str = `module.exports = {\n${reqs}\n}`
    await writeFileAsync(dist, str)
    console.log('createDone: ', dist)
  })
}

let vueTemplate = `<template>
  <div>
    <router-view></router-view>
  </div>
</template>
<script>
  export default {
  }
</script>
`

let appTemplate = `<template>
  <div id="app">
    <router-view class="view"></router-view>
  </div>
</template>
<script>
  export default {
  }
</script>
`

async function createVueFiles (modules, dest) {
  let {content, files} = createVueRoutes(modules, true, JSON5)
  await mkdirAsync(dest)
  await writeFileAsync(resolve(dest, 'routes.js'), `${noticeString}
${content}
`)
  let appVue = resolve(dest, 'App.vue')
  if (!await fileExistsAsync(appVue)) {
    console.log('createVueFile:', appVue)
    await writeFileAsync(appVue, appTemplate)
  }
  await Promise.all(files.map(async (file) => {
    file = resolve(dest, file)
    if (!await fileExistsAsync(file)) {
      let baseName = basename(file, '.vue')
      let dirName = basename(dirname(file))
      let template = vueTemplate
      if (baseName !== dirName) {
        template = vueTemplate.replace('<router-view></router-view>', baseName)
      }
      console.log('createVueFile:', file)
      await mkdirAsync(dirname(file))
      await writeFileAsync(file, template)
    }
  }))
  await createSchemaApiFile(modules, dest)
}

async function createSchemaApiFile (modules, dest) {
  // 名字长点也要唯一
  let allRoutes = {}
  // let allSchemas = []

  for (let moduleGroup in modules) {
    let group = modules[moduleGroup]
    for (let moduleName in group) {
      let modal = group[moduleName]
      // 提取schema
      if (modal.SavRoute) {
        // 生成路由
        let routes = [].concat(modal.SavRoute.parents).concat(modal.SavRoute.childs)
        let isPage = moduleGroup.toUpperCase() === 'PAGE'
        let isApi = moduleGroup.toUpperCase() === 'API'
        routes = routes.reduce((dist, it) => {
          it.methods.forEach((method) => {
            let name = camelCase(method.toLowerCase() + '_' +
              (isApi ? 'api_' : '') +
              it.uri.replace(isPage ? 'Page.' : 'Api.', '_'))
            let api = {
              path: it.path
            }
            allRoutes[name] = api
            dist.push(api)
          })
          return dist
        }, [])
      }
    }
  }
  let json = JSON5.stringify(allRoutes, null, 2)
  let apiData = `${noticeString}
export default ${json}
`
  let apiFile = resolve(dest, 'apis.js')
  console.log('createApiFile:', apiFile)
  await writeFileAsync(apiFile, apiData)
}

async function convert ({path, dest, plugins}) {
  if (dest === false) {
    dest = path
  }
  // 先注入全局装饰器
  let SavDecorators = (global.SavDecorators || decorators)
  global.SavDecorators = SavDecorators
  // console.log(requireFromString(src, 'hh.js'))
  // 按照目录结构读取文件
  let tasks = []
  let modules = readDirModules(path)
  for (let moduleGroup in modules) {
    let group = modules[moduleGroup]
    for (let moduleName in group) {
      let modal = group[moduleName]
      tasks.push(convertFile({
        moduleGroup,
        moduleName,
        modal,
        dest
      }))
    }
    createIndex(moduleGroup, group, dest)
  }
  return Promise.all(tasks.concat(createRoot(modules, dest))).then(() => {
    return modules
  })
  // console.log(modules)
  // @TODO 暂时不管插件的部分
  // if (plugins && plugins.length) {
  //   let pluginHandles = plugins.map((item) => require(findPlugins(program.path, item)))
  //   console.log(pluginHandles)
  // }
}

// program.plugins = ['test-plugin']
// console.log(findPlugins(program.path, 'test-plugin'))

export function findPlugins (root, name) {
  return findWithExtension(root, name, ['node_modules'])
}

function findWithExtension (dir, subdir, dirs, extensions) {
  let cur
  let it
  let noext = !!extname(subdir)
  let allDir = ['.'].concat(dirs)
  do {
    cur = resolve(dir)
    for (let m = 0, n = allDir.length; m < n; ++m) {
        // console.log(cur, allDir[m] +'/'+ subdir);
      if (fs.existsSync(it = resolve(cur, allDir[m] + '/' + subdir))) {
        return it
      }
      if (noext && extensions) {
        for (let i = 0, l = extensions.length; i < l; ++i) {
          if (fs.existsSync(it = resolve(cur, allDir[m] + '/' + subdir + extensions[i]))) {
            return it
          }
        }
      }
    }
    dir = dirname(cur)
  } while (cur !== dir)
}

// program.path = resolve('E:\\tmp\\decorators\\interface')
// program.dest = resolve('E:\\tmp\\decorators\\contract')

if (!program.path) {
  program.help()
  process.exit(0)
}

function halt (err) {
  console.error(err)
  process.exit(1)
}

function done () {
  console.log('done')
}

convert(program).catch(halt).then((modules) => {
  if (program.view) {
    return createVueFiles(modules, program.view)
  }
}).catch(halt).then(done)