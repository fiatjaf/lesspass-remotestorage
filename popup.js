/* global browser */

const deepEqual = require('deep-equal')
const component = require('./component')

document.head.appendChild(component.style)
document.body.appendChild(component.start())

var lastProfiles = []
var sendProfiles
var sendHost

component.use((_, emitter) => {
  sendProfiles = function (profiles) {
    emitter.emit('rs-profiles', profiles)
  }

  sendHost = function (host) {
    emitter.emit('active-host', host)
  }

  emitter.on('rs-delete', profileName => {
    // send profile to be deleted from remoteStorage
    browser.runtime.sendMessage({
      kind: 'to-delete',
      profileName: profileName
    })
  })

  emitter.on('out-password', password => {
    // write password to field
    browser.runtime.sendMessage({
      kind: 'fill-password',
      password
    })

    // also show the password on the popup
    emitter.emit('show-password', password)
  })

  emitter.on('rs-store', (domain, login, options) => {
    // send stuff to be saved on remoteStorage
    browser.runtime.sendMessage({
      kind: 'to-save',
      profile: {
        domain,
        login,
        options
      }
    })
  })
})

// messages from background.js
browser.runtime.onMessage.addListener(message => {
  console.log('popup got message', message)
  switch (message.kind) {
    case 'active-host':
      sendHost(message.host)
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

browser.runtime.sendMessage({
  kind: 'client-ready'
})
