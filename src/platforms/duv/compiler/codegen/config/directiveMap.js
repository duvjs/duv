let duvMap = {
  'v-on': {
    name: '',
    map: {
      click: 'tap'
    },
    type: 2
  },
  'v-pre': {
    name: '',
    type: 5
  },
  'v-cloak': {
    name: '',
    type: 5
  },
  'v-once': {
    name: '',
    type: 5
  }
}
let bdMap = {
  'v-if': {
    name: 's-if',
    type: 0
  },
  'v-else-if': {
    name: 's-elif',
    type: 0
  },
  'v-else': {
    name: 's-else',
    type: 1
  }
}
let wxMap = {
  'v-if': {
    name: 'wx:if',
    type: 0
  },
  'v-else-if': {
    name: 'wx:elif',
    type: 0
  },
  'v-else': {
    name: 'wx:else',
    type: 1
  },
}
function duvDirective () {
  if (global.duvType === 'bd') {
    return Object.assign(duvMap, bdMap)
  } else {
    return Object.assign(duvMap, wxMap)
  }
}
export default duvDirective
