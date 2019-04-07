import {warn} from "./util";
import { initMixin } from "./init";
import { initEvents } from "./events";
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

initMixin(Vue);
initEvents(Vue);

Vue.version = '__VERSION__';

export default Vue
