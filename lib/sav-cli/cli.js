import program from 'commander'
import {resolve} from 'path'

import {loadInterface} from './plugins/interfaceLoader.js'
import {writeContract} from './plugins/contractWriter.js'
import {writeActions} from './plugins/actionWriter.js'
import {writeSass} from './plugins/sassWriter.js'
import {writeVue} from './plugins/vueWriter.js'
import {writeRollup} from './plugins/rollupWriter.js'
import {writePackage} from './plugins/packageWriter.js'

program
  .version('$$VERSION$$')
  .option('-i, --interface [interface]', 'input interface directory')
  .option('-c, --contract [contract]', 'input contract directory')
  .option('-d, --dest [dest]', 'dest dir, default .')

  .option('-m, --modal [modal]', 'output modals, -m contract,action,sass,vue,rollup,package, default all')
  .option('-S, --sassPage [sassPage]', 'sass page by modal|action', /^(modal|action)$/i, 'modal')
  .parse(process.argv)

let interfaceDir = 'interface' in program ? resolve(program.interface || '.', '') : false
let contractDir = 'contract' in program ? resolve(program.contract || '.', '') : false

if (!(interfaceDir || contractDir)) {
  program.help()
  process.exit(0)
}

const modalNames = 'contract,action,sass,vue,rollup,package'
let dest = resolve('.', program.dest || '.')
let modals = (program.modal || modalNames).split(',')

let promise = interfaceDir ? loadInterface(interfaceDir) : Promise.resolve()

promise.then((contract) => {
  if (!contract) {
    program.require = require
    contract = program.require(contractDir)
  }
  return contract
}).then((contract) => {
  let mods = modalNames.split(',')
  return Promise.all(modals.filter((name) => mods.indexOf(name) !== -1).map((name) => {
    switch (name) {
      case 'contract':
        return writeContract(resolve(dest, './contract'), contract)
      case 'action':
        return writeActions(resolve(dest, './actions'), contract.modals)
      case 'sass':
        return writeSass(resolve(dest, './sass'), contract.modals, {pageMode: program.sassPage === 'modal'})
      case 'vue':
        return writeVue(resolve(dest, './views'), contract.modals)
      case 'rollup':
        return writeRollup(resolve(dest, './scripts'))
      case 'package':
        return writePackage(dest)
    }
  }))
}).then(() => console.log('done'))