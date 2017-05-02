import {isString, isUndefined, isObject} from './type.js'

export function prop (target, key, value) {
  Object.defineProperty(target, key, {value, writable: true})
}

function makePropFunc (target, propName) {
  return (key, value) => {
    if (isObject(key)) {
      for (let name in key) {
        Object.defineProperty(target, name, {[`${propName}`]: key[name], writable: true})
      }
    } else {
      let descriptor = {[`${propName}`]: value}
      if (propName === 'value') {
        descriptor.writable = true
      }
      Object.defineProperty(target, key, descriptor)
    }
  }
}

export function makeProp (ctx, name) {
  if (ctx.prop) {
    return ctx.prop
  }
  let prop = makePropFunc(ctx, 'value')
  prop.getter = makePropFunc(ctx, 'get')
  prop.setter = makePropFunc(ctx, 'set')
  if (isString(name) || isUndefined(name)) {
    prop(name || 'ctx', ctx)
  }
  prop('prop', prop)
  return prop
}
