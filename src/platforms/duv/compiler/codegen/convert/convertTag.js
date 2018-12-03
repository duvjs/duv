import tagMap from '../config/tagMap'
export default function (ast) {
  let tag = ast.tag
  tag = tagMap[tag] || tag;
  ast.tag = tag
  return ast
}
