import { noop } from './util'
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

export function initEvents (Vue) {
  Vue.prototype._handleDuvEvent = function (e, eventName) {
    const rootVueVM = this;
    if (rootVueVM.$options && rootVueVM.$options.methods && rootVueVM.$options.methods[eventName]) {
      let duvEvent = rootVueVM.$options.methods[eventName]
      duvEvent.call(this, getWebEventByDUV(e))
    }
  }
  Vue.prototype.$emit = function (eventName, params, opt) {
    if (this.$duv.self.triggerEvent === 'function') {
      this.$duv.self.triggerEvent(eventName, params, opt||{});
    }
  };
}
