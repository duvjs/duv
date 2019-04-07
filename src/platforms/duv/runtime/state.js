import { noop, warn, hasOwn, isReserved, bind } from './util'
export function initState (vm) {
  let opts = vm.$options;
  if (opts.methods) { initMethods(vm, opts.methods); }
  if (opts.data) {
    initData(vm);
  }
}
function initData (vm) {
  let data = vm.$options.data;
  vm._data = typeof data === 'function'
    ? data.call(vm, vm)
    : data || {};
}
function initMethods (vm, methods) {
  let props = vm.$options.props;
  for (let key in methods) {
    if (methods[key] == null) {
      warn(
        "Method \"" + key + "\" has an undefined value in the component definition. " +
        "Did you reference the function correctly?"
      );
    }
    if (props && hasOwn(props, key)) {
      warn(
        ("Method \"" + key + "\" has already been defined as a prop.")
      );
    }
    if ((key in vm) && isReserved(key)) {
      warn(
        "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
        "Avoid defining component methods that start with _ or $."
      );
    }
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm);
  }
}
