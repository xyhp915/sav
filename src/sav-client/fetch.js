import {pascalCase, ajax} from 'sav-util'
import {promiseNext} from '../sav/util/helper.js'

function toJSON () {
  return Object.assign({
    message: this.message,
    type: this.constructor.name,
    stack: this.stack
  }, this)
}

export function normalizeFetch (contract, flux) {
  flux.prop('fetchRoute', fetchRoute.bind(flux))
  flux.prop('fetchUri', fetchUri.bind(flux))
  let actions = createActions(contract, flux)
  flux.declare({
    actions
  })
  flux.on('fetch', fetchFromMockState.bind(flux))
}

function fetchFromMockState (ctx) {
  let rule = ctx.rule
  if (!rule) {
    return
  }
  let mockState = this.opt('mockState')
  if (mockState) {
    if (!rule.responseSchema) {
      if (this.opt('mockAllowNoResponse')) { // 允许空的 mock 数据
        ctx.fetch = () => {
          return Promise.resolve().then(() => {
            return {}
          })
        }
        return
      }
      throw new Error(`uri ${rule.uri} has no responseSchma.`)
    }
    let mockData
    if (this.contract.mock) {
      let mocks = this.contract.mock[rule.response]
      if (mocks) {
        mockData = mocks[0]
        ctx.mockData = mockData
      }
    }
    ctx.fetch = () => {
      return Promise.resolve().then(() => {
        let data
        if (ctx.mockData) {
          data = rule.responseSchema.create(ctx.mockData.props)
        } else {
          data = rule.responseSchema.createResponse()
        }
        return {
          data
        }
      })
    }
  }
}

function fetchUri (data) {
  return this.fetchRoute(data)
    .then(({data}) => {
      let newData = Object.assign({error: {}}, data)
      return this.updateState(newData)
    }, (err) => {
      let error = toJSON.call(err)
      return this.updateState({error}).then(() => {
        throw error
      })
    })
}

function createActions (contract, flux) {
  let actions = {}
  let {uris} = contract
  for (let uri in uris) {
    let ret = uris[uri]
    if (ret.isRoute) {
      let {props} = ret
      let isPage = ret.isPage = (uri.indexOf('page.') === 0)
      let {method} = props
      if (!method) {
        method = isPage ? 'GET' : 'POST'
      }
      ret.method = method
      let actionName = ret.actionName = method.toLowerCase() + pascalCase(`${uri.replace('page.', '')}`.replace(/\./g, '_'))
      actions[actionName] = ({fetchUri}, data) => {
        return fetchUri(Object.assign({uri}, data))
      }
    }
  }
  return actions
}

function fetchRoute (opts) {
  // {uri, url, params, data} + route
  let ctx = Object.assign({
    headers: {
      accept: 'application/json'
    },
    rule: this.contract.uris[opts.uri]
  }, opts)
  let next = promiseNext()
  try {
    if (ctx.rule) {
      let {props, route} = ctx.rule
      if (props.timeout) {
        ctx.timeout = props.timeout
      }
      if (!ctx.method) {
        ctx.method = route.method
      }
      if (!ctx.url) {
        ctx.url = route.regexp(ctx.params)
      }
    }
    // url 合并
    if (!/^http(s)?:/.test(ctx.url) || !/^\/\//.test(ctx.url)) { // 指定协议或使用 //
      ctx.url = this.opt('baseUrl', '') + ctx.url
    }
    ctx.fetch = ajaxFetch
    this.emit('fetch', ctx, next) // prepare
    next(() => {
      return ctx.fetch(ctx).then((res) => {
        if (!this.opt('mockState') && ctx.rule) {
          let rule = ctx.rule
          if (rule.responseSchema) {
            try {
              rule.responseSchema.check(res.data)
            } catch (err) {
              if (this.opt('checkSlient')) {
                this.emit('error', err)
              } else {
                throw err
              }
            }
          }
        }
        return res
      })
    })
  } catch (err) {
    next(() => { throw err })
  }
  return next()
}

function ajaxFetch (ctx) {
  return new Promise((resolve, reject) => {
    ajax(ctx, (err, data, headers) => {
      if (err) {
        reject(err)
      }
      resolve({data, headers, ctx})
    })
  })
}