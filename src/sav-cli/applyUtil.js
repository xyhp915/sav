import {writeFileAsync, mkdirAsync} from './sav/util/file.js'
import {resolve} from 'path'

const noticeString = '// @NOTICE This file is generated by sav-cli.\n\n'
const applyTitle = '[   Apply]'

export function createIndex (groupDir, group, dest, asArray, asAssign) {
  return Promise.resolve().then(async () => {
    let dir = resolve(dest, groupDir)
    let dist = resolve(dir, 'index.js')
    console.log(`${applyTitle}[ensure] `, dir)
    await mkdirAsync(dir)
    console.log(`${applyTitle}[create] `, dist)
    if (asAssign) {
      let reqs = Object.keys(group).map((name) => `  require('./${name}')`).join(',\n')
      let str = `${noticeString}module.exports = Object.assign({},\n${reqs}\n)\n`
      await writeFileAsync(dist, str)
    } else {
      if (asArray) {
        let reqs = Object.keys(group).map((name) => `  require('./${name}')`).join(',\n')
        let str = `${noticeString}module.exports = [\n${reqs}\n]\n`
        await writeFileAsync(dist, str)
      } else {
        let reqs = Object.keys(group).map((name) => `  ${name}: require('./${name}')`).join(',\n')
        let str = `${noticeString}module.exports = {\n${reqs}\n}\n`
        await writeFileAsync(dist, str)
      }
    }
  })
}

export function createRoot (groups, dest) {
  return Promise.resolve().then(async () => {
    await mkdirAsync(dest)
    let dist = resolve(dest, 'index.js')
    console.log(`${applyTitle}[create] `, dist)

    let reqs = Object.keys(groups).map((name) => {
      let ret = `  ${name}: require('./${name}')`
      if (name === 'mock') {
        return `// #if IS_MOCK
${ret},
// #endif`
      }
      return ret
    }).join(',\n')

    reqs = reqs.replace('#endif,', `#endif`)
    let str = `${noticeString}module.exports = {\n${reqs}\n}\n`
    await writeFileAsync(dist, str)
  })
}
