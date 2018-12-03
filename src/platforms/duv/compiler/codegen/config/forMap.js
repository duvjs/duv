function duvFor () {
  if (global.duvType === 'bd') {
    return {
      if: 's-if',
      iterator1: 's-for-index',
      key: 's-key',
      alias: 's-for-item',
      forText: 's-for'
    }
  } else {
    return {
      if: 'wx:if',
      iterator1: 'wx:for-index',
      key: 'wx:key',
      alias: 'wx:for-item',
      forText: 'wx:for'
    }
  }
}
export default duvFor
