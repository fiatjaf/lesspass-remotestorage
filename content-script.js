/* global chrome */

const Popper = require('popper.js')
const component = require('./component')

chrome.runtime.onMessage.addListener(message => {
  if (message.kind === 'lesspass-here') {
    console.log(message.profiles)
    attach(document.activeElement, message.profiles)
  }
})

function attach (el, profiles) {
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
    removeOnDestroy: true
  })

  document.body.appendChild(lessPass)

  let shadow = lessPass.attachShadow({mode: 'closed'})
  shadow.appendChild(component.style)
  shadow.appendChild(component.start())

  component.use((_, emitter) => {
    emitter.on('destroy', () => {
      popper.destroy()
    })

    emitter.on('password', (password, domain, login, options) => {
      console.log('got password', password, domain, login, options)
      el.value = password
      popper.destroy()

      // send stuff to be saved on remoteStorage
      chrome.runtime.sendMessage({
        host: location.host,
        profile: {
          domain,
          login,
          options
        }
      })
    })
  })
}
