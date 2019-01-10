import {callHook, warn, hasOwn, isReserved, noop} from "./util";

export function lifecycleMixin (Vue) {
  Vue.prototype._mountDuv = mountDuv
  Vue.prototype.$mount = function (duvType) {
    // 初始化小程序生命周期相关
    const options = this.$options
    if (options) {
      return this._mountDuv(duvType, () => {
      })
    }
  }
  Vue.prototype.setData = function (obj, callback) {
    if (callback) {
      this.$duv.self.setData(obj, callback)
    } else {
      this.$duv.self.setData(obj)
    }
  }
  Vue.prototype.getEnv = function () {
    if(global && global.env)
      return global.env
    else
      return 'web'
  }
}

function mountDuv (duvType) {
  const vm = this;
  vm.$duv = {}
  const duv = vm.$duv
  duv.duvType = duvType
  switch (duvType) {
    case 'app':
      mountApp(vm)
      break;
    case 'component':
      mountComponent(vm)
      break;
    case 'page':
      mountPage(vm)
      break;
    default:
      mountPage(vm)
      break;
  }
}
function mountApp(vm) {
  global.App({
    globalData: vm.$options.globalData||{},
    onLaunch (options = {}) {
      // duv.app = this
      vm.$duv.self = this
      // dataProxy(rootVueVM, this)
      initState(vm)
      callHook(vm, 'created', options)
      callHook(vm, 'onLaunch', options)
    },
    onShow (options = {}) {
      callHook(vm, 'onShow', options)
    },
    onHide () {
      callHook(vm, 'onHide')
    },
    onError (err) {
      callHook(vm, 'onError', err)
    }
  })
}
function mountPage(vm) {
  const app = global.getApp()
  global.Page({
    // 页面的初始数据
    data: vm._data,
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
      duvEventProxy(vm, 'eventCaptureCatch', e)
    },
    _captureBindEventProxy (e) {
      duvEventProxy(vm, 'eventCaptureBind', e)
    },
    _catchEventProxy (e) {
      duvEventProxy(vm, 'eventCatch', e)
    },
    _bindEventProxy (e) {
      duvEventProxy(vm, 'eventBind', e)
    },
    onLoad (query) {
      this.globalData = app.globalData
      // duv.page = this
      vm.$duv.self = this
      vm.$duv.query = query
      // duv.status = 'load'
      // dataProxy(vself, this)
      initState(vm)
      callHook(vm, 'created', query)
      callHook(vm, 'onLoad', query)
    },
    onShow () {
      // vm.$duv.page = this
      // duv.status = 'show'
      callHook(vm, 'onShow')
    },
    onReady () {
      callHook(vm, 'beforeMount')
      callHook(vm, 'onReady')
      callHook(vm, 'mounted')
    },
    onHide () {
      callHook(vm, 'onHide')
      // duv.page = null
    },
    onUnload () {
      callHook(vm, 'beforeDestory')
      callHook(vm, 'onUnload')
      callHook(vm, 'destoryed')
      // duv.page = null
    },
    onPullDownRefresh () {
      callHook(vm, 'onPullDownRefresh')
    },
    onReachBottom () {
      callHook(vm, 'onReachBottom')
    },
    onShareAppMessage: vm.$options.onShareAppMessage
      ? options => callHook(vm, 'onShareAppMessage', options) : null,
    onPageScroll (options) {
      callHook(vm, 'onPageScroll', options)
    },
    onResize (options) {
      callHook(vm, 'onResize', options)
    },
    onTabItemTap (options) {
      callHook(vm, 'onTabItemTap', options)
    }
  })
}
function mountComponent(vm) {
  // const app = global.getApp()
  global.Component({
    // 小程序原生的组件属性
    properties: convertProps(vm),
    data: vm._data,
    methods: {
      _captureCatchEventProxy (e) {
        duvEventProxy(vm, 'eventCaptureCatch', e)
      },
      _captureBindEventProxy (e) {
        duvEventProxy(vm, 'eventCaptureBind', e)
      },
      _catchEventProxy (e) {
        duvEventProxy(vm, 'eventCatch', e)
      },
      _bindEventProxy (e) {
        duvEventProxy(vm, 'eventBind', e)
      }
    },
    created () {
      // this.globalData = app.globalData
      // duv.page = this
      vm.$duv.self = this
      // dataProxy(vself, this)
      initState(vm)
    },
    attached () {
      // duv.status = 'attached'
      if(vm.$options.props) {
        // vm.$options.props
        // propsProxy(rootVueVM.$options.props, this.properties, vself)
      }
      callHook(vm, 'created')
      callHook(vm, 'beforeMount')
      callHook(vm, 'attached')
    },
    ready () {
      // duv.status = 'ready'
      callHook(vm, 'mounted')
      callHook(vm, 'ready')
    },
    moved () {
      callHook(vm, 'moved')
    },
    detached () {
      // duv.status = 'detached'
      callHook(vm, 'beforeDestory')
      callHook(vm, 'detached')
      callHook(vm, 'destoryed')
    },
    pageLifetimes: {
      show: function () {
        callHook(vm, 'onShow')
      },
      hide: function () {
        callHook(vm, 'onHide')
      },
      resize: function () {
        callHook(vm, 'onResize')
      },
    },
  })
}
function initState (vm) {
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.data) {
    initData(vm)
  }
  initDuvGlobalApi(vm)

}
function initDuvGlobalApi (vm) {
  let arr = ['globalData', 'triggerEvent']
  for(let i =0, len = arr.length; i < len; i++) {
    proxyDuvGlobalApi(vm, arr[i])
  }
}
/**
 * 代理 globalData
 * @param target
 */
function proxyDuvGlobalApi (target, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this['$duv']['self'][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this['$duv']['self'][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
function initProps (vm, props) {
  for (const key in props) {
    if (!(key in vm)) {
      proxy(vm, `data`, key)
    }
  }
}
function initData (vm) {
  let data = vm._data;
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        warn(
          `Method "${key}" has already been defined as a data property.`,
          vm
        )
      }
    }
    if (props && hasOwn(props, key)) {
      process.env.NODE_ENV !== 'production' && warn(
        `The data property "${key}" is already declared as a prop. ` +
        `Use prop default value instead.`,
        vm
      )
    } else if (!isReserved(key)) {
      proxy(vm, `data`, key)
    }
  }
}
const sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
}

function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this['$duv']['self'][sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    let temp = {}
    temp[key] = val
    this['$duv']['self'].setData(temp)
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}

function duvEventProxy (vm, eventType, e) {
  let target = e.currentTarget || e.target || {}
  let dataSet = target.dataset||{}
  let type = e.type
  if (typeof type === 'string' && type !== '' ) {
    type = type.substring(0,1).toUpperCase()+type.substring(1);
    let vEventName = dataSet[eventType + type]
    if(typeof vEventName === 'string' && vEventName !== '' ) {
      return vm._handleDuvEvent(e, vEventName)
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
      for (let i = 0, len = value.length; i < len; i++) {
        properties[value[i]] = null
      }
    } else if (value instanceof Object) {
      // 默认值default 不能是function
      let property = {}
      property.type = value.type
      value.default && (property.value = value.default)
      if(value.observer instanceof Function) {
        property.observer = value.observer
      }
      properties[key] = property
    }
  })

  return properties
}

