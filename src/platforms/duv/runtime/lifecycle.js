import { noop, isReserved, hasOwn, callHook } from "./util";

let sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function initState (vm) {
  let opts = vm.$options;
  if (opts.props) {
    initProps(vm, opts.props);
  }
  if (opts.data) {
    initData(vm);
  }
  initDuvGlobalApi(vm);

}
function initProps (vm, props) {
  for (let key in props) {
    if (!(key in vm)) {
      proxy(vm, "data", key);
    }
  }
}
function proxyDuvGlobalApi (target, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this['$duv']['self'][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this['$duv']['self'][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}
function initDuvGlobalApi (vm) {
  let arr = ['globalData'];
  for(let i =0, len = arr.length; i < len; i++) {
    proxyDuvGlobalApi(vm, arr[i]);
  }
}
function initData (vm) {
  let data = vm._data;
  let keys = Object.keys(data);
  let props = vm.$options.props;
  // let methods = vm.$options.methods;
  let i = keys.length;
  while (i--) {
    let key = keys[i];
    if (props && hasOwn(props, key)) ; else if (!isReserved(key)) {
      proxy(vm, "data", key);
    }
  }
}
function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this['$duv']['self'][sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    let temp = {};
    temp[key] = val;
    this['$duv']['self'].setData(temp);
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
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
        properties[value[i]] = null;
      }
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

export function mountDuv (duvType) {
  let vm = this;
  let duv = vm.$duv = {};
  duv.duvType = duvType;
  switch (duvType) {
    case 'app':
      mountApp(vm);
      break;
    case 'component':
      mountComponent(vm);
      break;
    case 'page':
      mountPage(vm);
      break;
    default:
      mountPage(vm);
      break;
  }
}
function mountApp(vm) {
  global.App({
    globalData: vm.$options.globalData||{},
    onLaunch: function onLaunch (options) {
      if ( options === void 0 ) options = {};
      vm.$duv.self = this;
      initState(vm);
      callHook(vm, 'created', options);
      callHook(vm, 'onLaunch', options);
    },
    onShow: function onShow (options) {
      if ( options === void 0 ) options = {};

      callHook(vm, 'onShow', options);
    },
    onHide: function onHide () {
      callHook(vm, 'onHide');
    },
    onError: function onError (err) {
      callHook(vm, 'onError', err);
    }
  });
}
function mountComponent(vm) {
  // const app = global.getApp()
  global.Component({
    // 小程序原生的组件属性
    properties: convertProps(vm),
    data: vm._data,
    methods: {
      _captureCatchEventProxy: function _captureCatchEventProxy (e) {
        duvEventProxy(vm, 'eCC', e);
      },
      _captureBindEventProxy: function _captureBindEventProxy (e) {
        duvEventProxy(vm, 'eCB', e);
      },
      _catchEventProxy: function _catchEventProxy (e) {
        duvEventProxy(vm, 'eC', e);
      },
      _bindEventProxy: function _bindEventProxy (e) {
        duvEventProxy(vm, 'eB', e);
      }
    },
    created: function created () {
      vm.$duv.self = this;
      initState(vm);
    },
    attached: function attached () {
      // duv.status = 'attached'
      if(vm.$options.props) ;
      callHook(vm, 'created');
      callHook(vm, 'beforeMount');
      callHook(vm, 'attached');
    },
    ready: function ready () {
      // duv.status = 'ready'
      callHook(vm, 'mounted');
      callHook(vm, 'ready');
    },
    moved: function moved () {
      callHook(vm, 'moved');
    },
    detached: function detached () {
      // duv.status = 'detached'
      callHook(vm, 'beforeDestory');
      callHook(vm, 'detached');
      callHook(vm, 'destoryed');
    },
    pageLifetimes: {
      show: function () {
        callHook(vm, 'onShow');
      },
      hide: function () {
        callHook(vm, 'onHide');
      },
      resize: function () {
        callHook(vm, 'onResize');
      },
    },
  });
}
function mountPage(vm) {
  let app = global.getApp();
  global.Page({
    // 页面的初始数据
    data: vm._data,
    _modelEventProxy: function _modelEventProxy (e) {
      let dataSet = e.currentTarget.dataset||{};
      let modelText = dataSet['modelText'];
      if(modelText) {
        let mData = {};
        mData[modelText] =  e.detail.value;
        this.setData(mData);
      }
    },
    _captureCatchEventProxy: function _captureCatchEventProxy (e) {
      duvEventProxy(vm, 'eCC', e);
    },
    _captureBindEventProxy: function _captureBindEventProxy (e) {
      duvEventProxy(vm, 'eCB', e);
    },
    _catchEventProxy: function _catchEventProxy (e) {
      duvEventProxy(vm, 'eC', e);
    },
    _bindEventProxy: function _bindEventProxy (e) {
      duvEventProxy(vm, 'eB', e);
    },
    onLoad: function onLoad (query) {
      this.globalData = app.globalData;
      vm.$duv.self = this;
      vm.$duv.query = query;
      initState(vm);
      callHook(vm, 'created', query);
      callHook(vm, 'onLoad', query);
    },
    onShow: function onShow () {
      callHook(vm, 'onShow');
    },
    onReady: function onReady () {
      callHook(vm, 'beforeMount');
      callHook(vm, 'onReady');
      callHook(vm, 'mounted');
    },
    onHide: function onHide () {
      callHook(vm, 'onHide');
    },
    onUnload: function onUnload () {
      callHook(vm, 'beforeDestory');
      callHook(vm, 'onUnload');
      callHook(vm, 'destoryed');
    },
    onPullDownRefresh: function onPullDownRefresh () {
      callHook(vm, 'onPullDownRefresh');
    },
    onReachBottom: function onReachBottom () {
      callHook(vm, 'onReachBottom');
    },
    onShareAppMessage: vm.$options.onShareAppMessage
      ? function (options) { return callHook(vm, 'onShareAppMessage', options); } : null,
    onPageScroll: function onPageScroll (options) {
      callHook(vm, 'onPageScroll', options);
    },
    onResize: function onResize (options) {
      callHook(vm, 'onResize', options);
    },
    onTabItemTap: function onTabItemTap (options) {
      callHook(vm, 'onTabItemTap', options);
    }
  });
}
