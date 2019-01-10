import { initMixin } from './init'
import { initEvents } from './events'
import { lifecycleMixin } from './lifecycle'
// import { warn } from '../util/index'

function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    // warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue)
initEvents(Vue)
lifecycleMixin(Vue)

export default Vue
