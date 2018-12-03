import Vue from 'core/index'
import { mountComponent } from 'core/instance/lifecycle'

import {
  mustUseProp,
  isReservedTag,
  isReservedAttr,
  getTagNamespace,
  isUnknownElement
} from 'duv/util/index'

// install platform specific utils
Vue.config.mustUseProp = mustUseProp
Vue.config.isReservedTag = isReservedTag
Vue.config.isReservedAttr = isReservedAttr
Vue.config.getTagNamespace = getTagNamespace
Vue.config.isUnknownElement = isUnknownElement

// install platform patch function
Vue.prototype.__patch__ = function() {}
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
Vue.prototype.$mount = function (duvType) {
  // 初始化小程序生命周期相关
  const options = this.$options
  if (options) {
    return this._mountDuv(duvType, () => {
      return mountComponent(this, undefined, undefined)
    })
  } else {
    return mountComponent(this, undefined, undefined)
  }
}

import { mountDuv } from './lifecycle'
Vue.prototype._mountDuv = mountDuv

import { handleDuvEvent } from './events'
Vue.prototype._handleDuvEvent = handleDuvEvent

export default Vue
