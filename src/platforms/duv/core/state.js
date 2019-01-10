import {getData} from "../../../core/instance/state";

export function initState (vm) {
  const opts = vm.$options
  if (opts.data) {
    initData(vm)
  }
}
function initData (vm) {
  let data = vm.$options.data
  vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
}
