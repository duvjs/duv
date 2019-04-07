import {callHook} from "./util";
import {initState} from "./state";
import { mountDuv } from './lifecycle';

export function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = options;
    vm._self = vm;
    callHook(vm, 'beforeCreate');
    initState(vm);
  };
  Vue.prototype.setData = function (obj, callback) {
    if (callback) {
      this.$duv.self.setData(obj, callback);
    } else {
      this.$duv.self.setData(obj);
    }
  };
  Vue.prototype.getEnv = function () {
    if(global && global.env)
      return global.env;
    else
      return 'web';
  };
  Vue.prototype.$mount = function (duvType) {
    // 初始化小程序生命周期相关
    const options = this.$options;
    if (options) {
      return this._mountDuv(duvType)
    }
  };
  Vue.prototype._mountDuv = mountDuv;
}
