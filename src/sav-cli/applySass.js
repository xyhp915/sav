import {createVueRoutes} from './applyVue.js'
import {resolve} from 'path'
import {fileExistsAsync, writeFileAsync, mkdirAsync} from './sav/util/file.js'
import {hyphenCase} from 'sav-util'

const noticeString = '// @NOTICE This file is generated by sav-cli.\n\n'
const applyTitle = '[    Sass]'

export async function applySass (groups, program) {
  let {files} = createVueRoutes(groups)
  let modals = {}
  let acts = []
  files.forEach((file) => {
    // './Home/HomeAbout.vue' => ['home', 'home-about']
    file = file.substr(2).slice(0, -4).split('/')
    let dir = hyphenCase(file.shift())
    let name = hyphenCase(file.shift())
    let arr = modals[dir] || (modals[dir] = [])
    arr.push(name)
    acts.push(`${dir}/${name}`)
  })
  console.log(`${applyTitle}[ensure] `, program.sass)
  await mkdirAsync(program.sass)
  let {sassPage} = program
  if (sassPage === 'modal') {
    for (let name in modals) {
      await createSassFile(program.sass, name, modals[name])
    }
    await createIndexFile(program.sass, Object.keys(modals))
  } else if (sassPage === 'action') {
    for (let name in modals) {
      await createSassFile(program.sass, name, modals[name], true)
    }
    await createIndexFile(program.sass, acts, true)
  }
}

async function createSassFile (dir, modal, arr, isAction) {
  if (isAction) {
    await mkdirAsync(resolve(dir, modal))
    for (let act of arr) {
      let path = resolve(dir, `${modal}/_${act}.sass`)
      if (!await fileExistsAsync(path)) {
        console.log(`${applyTitle}[create] `, path)
        await writeFileAsync(path, `${noticeString}// .${act}`)
      } else {
        console.log(`${applyTitle}[  skip] `, path)
      }
    }
  } else {
    let path = resolve(dir, `_${modal}.sass`)
    if (!await fileExistsAsync(path)) {
      let text = arr.map((name) => `${noticeString}// .${name}`).join('\n\n')
      console.log(`${applyTitle}[create] `, path)
      await writeFileAsync(path, text)
    } else {
      console.log(`${applyTitle}[  skip] `, path)
    }
  }
}

async function createIndexFile (dir, arr) {
  let text = arr.map((name) => `@import '${name}'`).join('\n')
  let path = resolve(dir, '_pages.sass')
  console.log(`${applyTitle}[create] `, path)
  await writeFileAsync(path, `${noticeString}${text}`)
  let app = resolve(dir, 'app.sass')
  if (!await fileExistsAsync(app)) {
    let text = `@import '_pages.sass'\n`
    console.log(`${applyTitle}[create] `, app)
    await writeFileAsync(app, `${noticeString}${text}`)
  }
}
