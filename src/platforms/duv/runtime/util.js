const hasOwnProperty = Object.prototype.hasOwnProperty;
export function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}
export function noop () {}
export function warn (msg) {
  console.log(msg);
}
export function callHook (vm, hook, params) {
  let handler = vm.$options[hook];
  if (typeof handler === 'function') {
    try {
      handler.call(vm, params);
    } catch (e) {
      warn((hook + " hook error"));
    }
  }
}
export function isReserved(str) {
  let c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

function polyfillBind (fn, ctx) {
  function boundFn (a) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind (fn, ctx) {
  return fn.bind(ctx)
}

export const bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind
