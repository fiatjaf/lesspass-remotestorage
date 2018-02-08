/* global chrome, Event */

const outsideClick = require('outside-click')
const deepEqual = require('deep-equal')
const component = require('./component')

if (!window.loaded) {
  window.loaded = true

  var passwordField
  var outsideHandler = {off: () => {}}
  var sendProfiles
  var hidePasswordIfShown
  var lastProfiles = []
  var remove

  var lessPass = document.createElement('div')
  document.body.appendChild(lessPass)

  lessPass.style.zIndex = 999
  lessPass.style.display = 'none'
  lessPass.style.position = 'fixed'
  lessPass.style.top = '9px'
  lessPass.style.right = '9px'

  let shadow = lessPass.attachShadow({mode: 'closed'})
  shadow.appendChild(component.style)
  shadow.appendChild(component.start())

  function showWidget () {
    if (document.activeElement.type === 'password') {
      passwordField = document.activeElement
    } else {
      passwordField = undefined
    }

    hidePasswordIfShown()

    lessPass.style.display = 'block'
    outsideHandler = outsideClick(lessPass, () => {
      remove()
    })
  }

  component.use((_, emitter) => {
    remove = function () {
      emitter.emit('showingprofiles', false)
      lessPass.style.display = 'none'
      outsideHandler.off()
    }

    emitter.on('destroy', () => {
      remove()
    })

    sendProfiles = function (profiles) {
      emitter.emit('rs-profiles', profiles)
    }

    hidePasswordIfShown = function () {
      emitter.emit('hide-password')
    }

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

    emitter.on('rs-delete', profileName => {
      // send profile to be deleted from remoteStorage
      chrome.runtime.sendMessage({
        kind: 'to-delete',
        profileName: profileName
      })
    })

    emitter.on('out-password', password => {
      // write password to field
      if (passwordField) {
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set
        nativeInputValueSetter.call(passwordField, password)
        passwordField.dispatchEvent('input', new Event('input', {bubbles: true}))
        passwordField.value = password
        remove()
      } else {
        // if there's no password field to write to, just show
        // the password on the widget itself
        emitter.emit('show-password', password)
      }
    })
  })

  // show the widget the first time we load this script no matter what
  showWidget()

  // messages from background.js
  chrome.runtime.onMessage.addListener(message => {
    console.log('got message on popup', message)
    switch (message.kind) {
      case 'lesspass-here':
        showWidget()
        break
      case 'profiles':
        if (
          message.profiles &&
          message.profiles.length &&
          !deepEqual(lastProfiles, message.profiles)
        ) {
          lastProfiles = message.profiles
          sendProfiles(message.profiles)
        }
        break
    }
  })

  chrome.runtime.sendMessage({
    kind: 'client-ready'
  })
}
