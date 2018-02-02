/* global chrome */

const Popper = require('popper.js')
const component = require('./component')
const {selectorFromNode} = require('./utils')

chrome.runtime.onMessage.addListener((message) => {
  if (message === 'lesspass-here') {
    attach(document.activeElement)
  }
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
      let page = {
        url: location.protocol + '//' + location.host + location.pathname + location.search,
        password_field: selectorFromNode(el)
      }

      let profile = {
        actual_domain: domain,
        login,
        options
      }

      chrome.runtime.sendMessage({page, profile})
    })
  })
}
