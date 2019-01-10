import {callHook} from "./util";
import {initState} from "./state";

export function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options
    vm._self = vm
    vm.$root = vm
    callHook(vm, 'beforeCreate')
    initState(vm)
  }
}
