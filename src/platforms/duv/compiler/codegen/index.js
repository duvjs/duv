import convert from './convert/convert'
/**
 *
 * @param compiled ast
 * @param options
 * @returns {{code: *|string, compiled: *, slots: {}}}
 */
export function compileToWxml (compiled) {
  let code = convert(compiled.ast)
  return { code }
}
