/* global chrome */

const component = require('./component')

if (!window.loaded) {
  window.loaded = true

  chrome.runtime.onMessage.addListener(message => {
    if (message.kind === 'lesspass-here') {
      passwordField = document.activeElement
  
      sendProfiles(message.profiles)
  
      lessPass.style.display = 'block'
    }
  })
  
  var passwordField
  var sendProfiles
  
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
    emitter.on('destroy', () => {
      lessPass.style.display = 'none'
    })
  
    sendProfiles = function (profiles) {
      emitter.emit('profiles', profiles)
    }
  
    emitter.on('password', (password, domain, login, options) => {
      lessPass.style.display = 'none'
  
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
