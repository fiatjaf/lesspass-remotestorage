/* global chrome */

const Popper = require('popper.js')
const component = require('./component')

chrome.runtime.onMessage.addListener((message) => {
  if (message === 'lesspass-here') {
    attach(document.activeElement)
  }
  return true
})

function attach (el) {
  var lessPass = document.createElement('div')

  let popper = new Popper(el, lessPass, {
    placement: 'right',
    modifiers: {
      flip: {
        behavior: ['right', 'left', 'top']
      },
      preventOverflow: {
        boundariesElement: document.body
      }
    },
    eventsEnabled: false
  })

  lessPass.id = 'lesspass'
  document.body.appendChild(lessPass)

  lessPass.appendChild(component.start())

  component.use((_, emitter) => {
    emitter.on('destroy', () => {
      popper.destroy()
    })

    emitter.on('password', password => {
      console.log('got password', password)
      el.value = password
      popper.destroy()
    })
  })
}
