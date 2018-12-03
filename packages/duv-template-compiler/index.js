try {
  var vueVersion = require('duv/package.json').version
} catch (e) {}

var packageName = require('./package.json').name
var packageVersion = require('./package.json').version
if (vueVersion && vueVersion !== packageVersion) {
  throw new Error(
    '\n\nDuv packages version mismatch:\n\n' +
    '- duv@' + vueVersion + '\n' +
    '- ' + packageName + '@' + packageVersion + '\n\n' +
    'This may cause things to work incorrectly. Make sure to use the same version for both.\n' +
    'If you are using duv-loader, re-installing them should bump ' + packageName + ' to the latest.\n'
  )
}

module.exports = require('./build')
