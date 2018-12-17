import { handleError } from 'core/util/index'

/**
 * 数据代理
 * @param v
 * @param d
 */
function dataProxy (v, d) {
  const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: null,
    set: null
  }
  if(!v.globalData) v.globalData = {}
  let dataKeys = Object.keys(v._data || {})
  function proxy (vSelf, dSelf, key) {
    let value = vSelf[key]
    sharedPropertyDefinition.get = function proxyGetter () {
      if(key === 'globalData' || key === 'triggerEvent') {
        return dSelf[key]
      } else if (dataKeys.includes(key)) {
        return dSelf.data[key]
      } else {
        return value
      }
    }
    sharedPropertyDefinition.set = function proxySetter (val) {
      if (dataKeys.includes(key)) {
        let sdata = {}
        sdata[key] = val
        dSelf.setData(sdata)
      } else {
        value = val
      }
    }
    Object.defineProperty(vSelf, key, sharedPropertyDefinition)
  }
  for (let k in v) {
    proxy(v, d, k)
  }
}
function propsProxy (v, d, vs) {
  const sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: null,
    set: null
  }
  function proxy (vSelf, dSelf, key) {
    sharedPropertyDefinition.get = function proxyGetter () {
        return dSelf[key]
    }
    sharedPropertyDefinition.set = function proxySetter (val) {
      dSelf[key] = val
    }
    Object.defineProperty(vSelf, key, sharedPropertyDefinition)
  }
  for (let k in v) {
    proxy(vs, d, k)
  }
}
/**
 * 事件代理
 * @param vueVM
 * @param eventType
 * @param e
 */
function duvEventProxy (vueVM, eventType, e) {
  let target = e.currentTarget || e.target || {}
  let dataSet = target.dataset||{}
  let type = e.type
  if (typeof type === 'string' && type !== '' ) {
    type = type.substring(0,1).toUpperCase()+type.substring(1);
    let vEventName = dataSet[eventType + type]
    if(typeof vEventName === 'string' && vEventName !== '' ) {
      return vueVM._handleDuvEvent(e, vEventName)
    }
  }
}

/**
 * 小程序生命周期挂载
 * @param vm
 * @param hook
 * @param params
 */
export function callHook (vm, hook, params) {
  let handlers = vm.$options[hook]
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm, params)
      } catch (e) {
        handleError(e, vm, `${hook} hook`)
      }
    }
  }
}

/**
 * 转换vue组件props =》 properties
 * @param vm
 */
function convertProps (vm) {
  const props = vm.$options.props || {}
  let alowTypes = [String, Number, Boolean, Object, Array, null]
  let properties = {}
  Object.keys(props).map(function (key) {
  // 类型（必填），目前接受的类型包括：String, Number, Boolean, Object, Array, null（表示任意类型）
  // 不支持 Symbol Function Date
    let value = props[key]
    if(alowTypes.includes(value)) {
      properties[key] = value
    } else if (value instanceof Array) {
      // 数组类型
      // todo
    } else if (value instanceof Object) {
      // 默认值default 不能是function
      let property = {}
      property.type = value.type
      property.value && (property.value = value.default)
      if(value.observer instanceof Function) {
        property.observer = value.observer
      }
      properties[key] = property
    }
  })

  return properties
}
export function mountDuv (duvType, next) {
  const vself = this;
  const rootVueVM = this.$root

  rootVueVM.$duv = {}
  const duv = rootVueVM.$duv

  duv.duvType = duvType
  // duv.status = 'register'

  if (duvType === 'app') {
    global.App({
      globalData: rootVueVM.$options.globalData||{},
      onLaunch (options = {}) {
        duv.app = this
        duv.self = this
        dataProxy(rootVueVM, this)
        callHook(rootVueVM, 'created', options)
        callHook(rootVueVM, 'onLaunch', options)
        next()
      },
      onShow (options = {}) {
        callHook(rootVueVM, 'onShow', options)
      },
      onHide () {
        callHook(rootVueVM, 'onHide')
      },
      onError (err) {
        callHook(rootVueVM, 'onError', err)
      }
    })
  } else if (duvType === 'component') {
    const app = global.getApp()
    global.Component({
      // 小程序原生的组件属性
      properties: convertProps(rootVueVM),
      data: rootVueVM._data,
      methods: {
        _captureCatchEventProxy (e) {
          duvEventProxy(rootVueVM, 'eventCaptureCatch', e)
        },
        _captureBindEventProxy (e) {
          duvEventProxy(rootVueVM, 'eventCaptureBind', e)
        },
        _catchEventProxy (e) {
          duvEventProxy(rootVueVM, 'eventCatch', e)
        },
        _bindEventProxy (e) {
          duvEventProxy(rootVueVM, 'eventBind', e)
        }
      },
      created () {
        this.globalData = app.globalData
        duv.page = this
        duv.self = this
        vself.triggerEvent = function () {}
        dataProxy(vself, this)
      },
      attached () {
        // duv.status = 'attached'
        if(rootVueVM.$options.props) {
          // vm.$options.props
          propsProxy(rootVueVM.$options.props, this.properties, vself)
        }
        callHook(rootVueVM, 'created')
        callHook(rootVueVM, 'beforeMount')
        callHook(rootVueVM, 'attached')
      },
      ready () {
        // duv.status = 'ready'
        callHook(rootVueVM, 'mounted')
        callHook(rootVueVM, 'ready')
        next()
      },
      moved () {
        callHook(rootVueVM, 'moved')
      },
      detached () {
        // duv.status = 'detached'
        callHook(rootVueVM, 'beforeDestory')
        callHook(rootVueVM, 'detached')
        callHook(rootVueVM, 'destoryed')
      },
      pageLifetimes: {
        show: function () {
          callHook(rootVueVM, 'onShow')
        },
        hide: function () {
          callHook(rootVueVM, 'onHide')
        },
        resize: function () {
          callHook(rootVueVM, 'onResize')
        },
      },
    })
  } else {
    const app = global.getApp()
    global.Page({
      // 页面的初始数据
      data: rootVueVM._data,
      _modelEventProxy (e) {
        let dataSet = e.currentTarget.dataset||{}
        let modelText = dataSet['modelText']
        if(modelText) {
          let mData = {}
          mData[modelText] =  e.detail.value
          this.setData(mData)
        }
      },
      _captureCatchEventProxy (e) {
        duvEventProxy(rootVueVM, 'eventCaptureCatch', e)
      },
      _captureBindEventProxy (e) {
        duvEventProxy(rootVueVM, 'eventCaptureBind', e)
      },
      _catchEventProxy (e) {
        duvEventProxy(rootVueVM, 'eventCatch', e)
      },
      _bindEventProxy (e) {
        duvEventProxy(rootVueVM, 'eventBind', e)
      },
      onLoad (query) {
        this.globalData = app.globalData
        duv.page = this
        duv.self = this
        duv.query = query
        // duv.status = 'load'
        dataProxy(vself, this)
        callHook(rootVueVM, 'created', query)
        callHook(rootVueVM, 'onLoad', query)
      },
      onShow () {
        duv.page = this
        // duv.status = 'show'
        callHook(rootVueVM, 'onShow')
      },
      onReady () {
        callHook(rootVueVM, 'beforeMount')
        callHook(rootVueVM, 'onReady')
        callHook(rootVueVM, 'mounted')
        next()
      },
      onHide () {
        callHook(rootVueVM, 'onHide')
        duv.page = null
      },
      onUnload () {
        callHook(rootVueVM, 'beforeDestory')
        callHook(rootVueVM, 'onUnload')
        callHook(rootVueVM, 'destoryed')
        duv.page = null
      },
      onPullDownRefresh () {
        callHook(rootVueVM, 'onPullDownRefresh')
      },
      onReachBottom () {
        callHook(rootVueVM, 'onReachBottom')
      },
      onShareAppMessage: rootVueVM.$options.onShareAppMessage
        ? options => callHook(rootVueVM, 'onShareAppMessage', options) : null,
      onPageScroll (options) {
        callHook(rootVueVM, 'onPageScroll', options)
      },
      onResize (options) {
        callHook(rootVueVM, 'onResize', options)
      },
      onTabItemTap (options) {
        callHook(rootVueVM, 'onTabItemTap', options)
      }
    })
  }
}
