import duvDirective from '../config/directiveMap'
import duvFor from '../config/forMap'
import babel from 'babel-core'
let forMap = {}
let directiveMap = {}
const colors = [
  'aqua','black','blue', 'fuchsia','gray','green','lime','maroon','navy','olive','purple','red','silver','teal','white','yellow'
]
function convertClassToString (classObject) {
  let result = babel.transform(`(${classObject})`, { plugins: [
      { visitor: {
          ObjectExpression: function (path) {
            const expression = path.node.properties.map(propertyItem => {
              const k = propertyItem.key.value || propertyItem.key.name
              let v = ''
              let value = propertyItem.value
              if (value.type === 'Identifier') {
                v = value.value||value.name
              } else {
                v = `'${value.value||value.name}'`
              }
              return `{{${v}?${k}:''}}`
            }).join(' ')
            const { metadata } = path.hub.file
            metadata.classString = expression
          }
        } }
    ] })
  return result.metadata.classString || ''
}

function convertStyleName (name) {
  return name.replace(/([A-Z])/g,'-$1').toLowerCase()
}
function makeData (obj) {
  if (obj.type === 'Identifier') {
    return `${obj.value||obj.name}`
  } else {
    return `'${obj.value||obj.name}'`
  }
}
function formartValue (obj) {
  if (typeof obj.left === 'object') {
    return formartValue(obj.left) + '+' + makeData(obj.right)
  }
  return makeData(obj)
}
function convertStyleToString (styleObject) {
  const result = babel.transform(`(${styleObject})`, { plugins: [
      { visitor: {
          ObjectExpression: function (path) {
            const expression = path.node.properties.map(propertyItem => {
              const k = propertyItem.key.value||propertyItem.key.name
              let v = ''
              if(propertyItem.value.type === 'BinaryExpression' && propertyItem.value.left) {
                v = formartValue(propertyItem.value)
              } else {
                let value = propertyItem.value
                if (value.type === 'Identifier') {
                  v = `{{${value.value||value.name}}}`
                } else {
                  let vTemp = value.value||value.name
                  if (colors.includes(vTemp)) {
                    v = `${vTemp}`
                  } else {
                    v = `'${vTemp}'`
                  }
                }
              }
              return `${convertStyleName(k)}:${v}`
            }).join(';')
            const { metadata } = path.hub.file
            metadata.styleString = expression
          }
        } }
    ] })
  return result.metadata.styleString || ''
}
function trim(s){
  return s.replace(/(^\s*)|(\s*$)/g, "");
}
function bind (k, v, attrs) {
  const name = k.replace(/^(v\-bind\:)|^(\:)/i, '')
  if (name === 'href') {
    attrs['url'] = `{{${v}}}`
  } else if (name === 'key') {
    attrs[forMap.key] = v
  } else if (name === 'class') {
    v = trim(v)
    if (/^\{/i.test(v) && /\}$/i.test(v)) {
      // 对象格式
      attrs[name] = convertClassToString(v)
    } else {
      attrs[name] = `{{${v}}}`
    }
  } else if (name === 'style') {
    if (/^\{/i.test(v) && /\}$/i.test(v)) {
      // 对象格式
      attrs[name] = convertStyleToString(v)
    } else {
      attrs[name] = `{{${v}}}`
    }
  } else {
    attrs[name] = `{{${v}}}`
  }
}
function model (k, v, attrs, tag) {
  const isFormInput = tag === 'input' || tag === 'textarea'
  attrs['value'] = `{{${v}}}`
  if (k === 'v-model.lazy' && isFormInput) {
    attrs['bindblur'] = '_modelEventProxy'
    attrs['data-model-text'] = v
  } else if (k === 'v-model' && isFormInput) {
    attrs['bindinput'] = '_modelEventProxy'
    attrs['data-model-text'] = v
  } else {
    attrs['bindchange'] = '_modelEventProxy'
    attrs['data-model-text'] = v
  }
}

/**
 * vue 事件修饰符
 * .stop
 .prevent
 .capture
 .self
 .once
 .passive
 小程序
 bind 事件冒泡
 catch 事件不冒泡
 capture-bind 事件捕获
 capture-catch 中断事件捕获
 * @param k
 * @param v
 * @param attrs
 */
function vevent (k, v, attrs, tag, attrsMap) {
  const { 'v-on':eventMap } = directiveMap
  const eventName = k.replace(/^v\-on\:/i, '')
    .replace(/^\@/i, '')
    .replace(/\.prevent/i, '')
    .replace(/\.self/i, '')
    .replace(/\.once/i, '')
    .replace(/\.passive/i, '')
  const [name, ...paramArr] = eventName.split('.')
  const xmlEventName = eventMap.map[name] || name

  let openTypes = ['getUserInfo', 'getPhoneNumber', 'contact', 'launchApp', 'openSetting']
  let openTpye = attrsMap['open-type']
  if (tag === 'button' && openTpye && openTypes.includes(openTpye)) {
    let methodName = ''
    switch (openTpye) {
      case 'getUserInfo':
        methodName = 'getuserinfo'
        break
      case 'getPhoneNumber':
        methodName = 'getphonenumber'
        break
      case 'contact':
        methodName = 'contact'
        break
      case 'launchApp':
        methodName = 'error'
        break
      case 'openSetting':
        methodName = 'opensetting'
        break
    }
    attrs['bind' + methodName] = '_bindEventProxy'
    attrs['data-event-bind-' + methodName] = v
  } else {
    if (paramArr.includes('capture')) {
      // 事件捕获
      if (paramArr.includes('stop')) {
        attrs['capture-catch:' + xmlEventName] = '_captureCatchEventProxy'
        // data-event-capture-catch
        attrs['data-e-c-c-' + xmlEventName] = v
      } else {
        attrs['capture-bind:' + xmlEventName] = '_captureBindEventProxy'
        // data-event-capture-bind
        attrs['data-e-c-b-' + xmlEventName] = v
      }
    } else {
      // 事件冒泡
      if (paramArr.includes('stop')) {
        attrs['catch' + xmlEventName] = '_catchEventProxy'
        // data-event-catch
        attrs['data-e-c-' + xmlEventName] = v
      } else {
        attrs['bind' + xmlEventName] = '_bindEventProxy'
        // data-event-bind
        attrs['data-e-b-' + xmlEventName] = v
      }
    }
  }
}
function vfor (ast, attrs) {
  const { iterator1, key, alias, for:forText, attrsMap } = ast
  if (forText) {
    attrs[forMap['forText']] = `{{${forText}}}`
    if (alias) {
      attrs[forMap['alias']] = alias
    }
    if (key) {
      attrs[forMap['key']] = key
      delete attrsMap[':key']
    }
    if (iterator1) {
      attrs[forMap['iterator1']] = iterator1
    }
    delete attrsMap['v-for']
  }
}
export default function (ast) {
  forMap = duvFor()
  directiveMap = duvDirective()
  const { attrsMap = {}, tag } = ast
  let attrs = {}

  if(ast.for) {
    vfor(ast, attrs)
  }
  let tagClass = `_${tag}`

  Object.keys(attrsMap).map(function (k) {
    let v = attrsMap[k]
    if (k === 'v-text') {
      ast.children.unshift({
        text: `{{${v}}}`,
        type: 3
      })
    } else if (k === 'v-html') {
      ast.children.unshift({
        tag: `rich-text`,
        type: 1,
        attrsMap: {
          nodes: `${v}`
        }
      })
    } else if (k === 'v-show') {
      attrs['hidden'] = `{{!(${v})}}`
    } else if (/^v\-on\:/i.test(k) || /^\@/.test(k)) {
      // 事件 v-on: @
      vevent(k, v, attrs, tag, attrsMap)
    } else if (/^v\-bind\:/i.test(k) || /^\:/.test(k)) {
      // v-bind: : 表示绑定数据
      bind(k, v, attrs)
    } else if (/^v\-model/.test(k)) {
      /**
       * 限制：
       * <input>
       <select>
       <textarea>
       */
      model (k, v, attrs, tag)
    } else if (directiveMap[k]) {
      // v-if v-else v-if-else v-for
      const {name, type} = directiveMap[k]
      if (type === 0) {
        attrs[name] = `{{${v}}}`
      } else if (type === 1) {
        attrs[name] = undefined
      }
    } else if (k === 'class' && v) {
      // attrs[k] = v
      attrs['staticClass'] = v
    } else if (k === 'href') {
      attrs['url'] = v
    } else {
      attrs[k] = v
    }
  })

  attrs.class = `${tagClass}${attrs.staticClass?(' ' + attrs.staticClass):''}${attrs.class?(' ' + attrs.class):''}`
  attrs.staticClass && delete attrs.staticClass

  ast.attrsMap = attrs
  return ast
}
