import convertTag from './convertTag'
import convertAttr from './convertAttr'

export default function convert (ast) {
  if (!ast.tag) {
    return ast.text
  }

  ast = convertAttr(ast)
  ast = convertTag(ast)

  const { tag, attrsMap = {}, children, ifConditions } = ast


  let attrs = Object.keys(attrsMap).map(function (k) {
    if (attrsMap[k]) {
      return `${k}="${attrsMap[k]}"`
    } else {
      return `${k}`
    }
  }).join(' ')

  let childrenXml = ''
  if (children && children.length > 0) {
    childrenXml = children.map(function (c) {
      return convert(c)
    }).join('')
  }

  let ifXml = ''
  if (ifConditions && ifConditions.length > 1) {
    ifXml = ifConditions.map(function (c, index) {
      if(index > 0) {
        return convert(c.block)
      } else {
        return ''
      }
    }).join('')
  }

  let closedTag = ['input', 'img']
  if (closedTag.includes(tag)) {
    return `<${tag}${attrs ? ' ' + attrs : ''} />${childrenXml || ''}${ifXml||''}`
  } else {
    return `<${tag}${attrs ? ' ' + attrs : ''}>${childrenXml || ''}</${tag}>${ifXml||''}`
  }


}
