/* global chrome */

const outsideClick = require('outside-click')
const component = require('./component')

if (!window.loaded) {
  window.loaded = true

  chrome.runtime.onMessage.addListener(message => {
    if (message.kind === 'lesspass-here') {
      passwordField = document.activeElement

      if (message.profiles && message.profiles.length &&
          lastProfiles.map(p => p.domain + '/' + p.login)[0] !==
          message.profiles.map(p => p.domain + '/' + p.login)[0]) {
        lastProfiles = message.profiles
        sendProfiles(message.profiles)
      }

      lessPass.style.display = 'block'

      outsideHandler = outsideClick(lessPass, () => {
        remove()
      })
    }
  })

  var outsideHandler = {off: () => {}}
  var passwordField
  var sendProfiles
  var lastProfiles = []

  var lessPass = document.createElement('div')
  document.body.appendChild(lessPass)

  lessPass.style.display = 'none'
  lessPass.style.position = 'fixed'
  lessPass.style.top = '9px'
  lessPass.style.right = '9px'

  let shadow = lessPass.attachShadow({mode: 'closed'})
  shadow.appendChild(component.style)
  shadow.appendChild(component.start())

  function remove () {
    lessPass.style.display = 'none'
    outsideHandler.off()
  }

  component.use((_, emitter) => {
    emitter.on('destroy', () => {
      remove()
    })

    sendProfiles = function (profiles) {
      emitter.emit('profiles', profiles)
    }

    emitter.on('password', (password, domain, login, options) => {
      remove()

      // write password to field
      passwordField.value = password

      // send stuff to be saved on remoteStorage
      chrome.runtime.sendMessage({
        kind: 'to-save',
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
