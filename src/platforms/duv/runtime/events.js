import { noop } from 'shared/util'
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

export function handleDuvEvent (e, eventName) {
  const rootVueVM = this.$root
  if (rootVueVM.$options && rootVueVM.$options.methods && rootVueVM.$options.methods[eventName]) {
    let duvEvent = rootVueVM.$options.methods[eventName]
    duvEvent.call(this, getWebEventByDUV(e))
  }
}
