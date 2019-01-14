import { noop } from './util'
import Vue from "./index";

export function initEvents () {
  Vue.prototype._handleDuvEvent = function (e, eventName) {
    const vm = this.$root
    if (vm.$options && vm.$options.methods && vm.$options.methods[eventName]) {
      let duvEvent = vm.$options.methods[eventName]
      duvEvent.call(this, getWebEventByDUV(e))
    }
  }
  Vue.prototype.$emit = function (eventName, params, opt) {
    if (this.$duv.self.triggerEvent === 'function') {
      this.$duv.self.triggerEvent(eventName, params, opt||{})
    }
  }
}
function getWebEventByDUV (e) {
  const { type, timeStamp, touches, detail = {}, target = {}, currentTarget = {}} = e
  const { x, y } = detail
  const event = {
    duv: e,
    type,
    timeStamp,
    x,
    y,
    target: Object.assign({}, target, detail),
    detail: detail,
    currentTarget,
    stopPropagation: noop,
    preventDefault: noop
  }

  if (touches && touches.length) {
    Object.assign(event, touches[0])
  }
  return event
}
