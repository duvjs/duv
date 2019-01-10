export function callHook (vm, hook) {
  const handler = vm.$options[hook]
  if (typeof handler === 'function') {
    try {
      handler.call(vm)
    } catch (e) {
      warn(`${hook} hook error`)
    }
  }
}
export function noop () {}
export function warn (msg) {
  console.error(msg)
}
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}
export function isReserved(str) {
  const c = (str + '').charCodeAt(0)
  return c === 0x24 || c === 0x5F
}
export const bind = Function.prototype.bind

