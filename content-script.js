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
  var remove

  var lessPass = document.createElement('div')
  document.body.appendChild(lessPass)

  lessPass.style.display = 'none'
  lessPass.style.position = 'fixed'
  lessPass.style.top = '9px'
  lessPass.style.right = '9px'

  let shadow = lessPass.attachShadow({mode: 'closed'})
  shadow.appendChild(component.style)
  shadow.appendChild(component.start())

  component.use((_, emitter) => {
    remove = function () {
      emitter.emit('loading', false)
      lessPass.style.display = 'none'
      outsideHandler.off()
    }

    emitter.on('destroy', () => {
      remove()
    })

    sendProfiles = function (profiles) {
      emitter.emit('rs-profiles', profiles)
    }

    emitter.on('rs-delete', profileName => {
      // send profile to be deleted from remoteStorage
      chrome.runtime.sendMessage({
        kind: 'to-delete',
        profileName: profileName
      })
    })

    emitter.on('out-password', password => {
      remove()

      // write password to field
      passwordField.value = password
    })

    emitter.on('rs-store', (domain, login, options) => {
      // send stuff to be saved on remoteStorage
      chrome.runtime.sendMessage({
        kind: 'to-save',
        profile: {
          domain,
          login,
          options
        }
      })
    })
  })
}
