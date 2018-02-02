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
    }
  })

  document.body.appendChild(lessPass)

  let shadow = lessPass.attachShadow({mode: 'closed'})
  shadow.appendChild(component.style)
  shadow.appendChild(component.start())

  component.use((_, emitter) => {
    emitter.on('destroy', () => {
      popper.destroy()
      document.body.removeChild(lessPass)
    })

    emitter.on('password', password => {
      console.log('got password', password)
      el.value = password
      popper.destroy()
      document.body.removeChild(lessPass)
    })
  })
}
