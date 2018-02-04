/* global chrome */

const Discover = require('remotestoragejs/src/discover')

let token = document.querySelector('[name="token"]')
let user = document.querySelector('[name="user"]')
let button = document.getElementById('rs-fetch-token')

chrome.storage.sync.get(['user', 'token'], res => {
  user.value = res.user || ''
  token.value = res.token || ''
})

user.addEventListener('input', e => {
  let user = e.target.value
  chrome.storage.sync.set({user}, () => {
    if (chrome.runtime.lastError) {
      console.log('failed to save user', chrome.runtime.lastError)
    }
    console.log('saved user', user)
  })
})

token.addEventListener('input', e => {
  let token = e.target.value
  saveToken(token)
})

function saveToken (token) {
  chrome.storage.sync.set({token}, () => {
    if (chrome.runtime.lastError) {
      console.log('failed to save token', chrome.runtime.lastError)
    }
    console.log('saved token', token)
  })
}

var popupOpened = false

button.addEventListener('click', e => {
  e.preventDefault()
  Discover(user.value)
    .then(res => {
      window.open(res.authURL + '?' + [
        'redirect_uri=https://lesspass.alhur.es/',
        'scope=lesspass:rw',
        'client_id=https://lesspass.alhur.es',
        'response_type=token'
      ].join('&'))

      popupOpened = true
    })
    .catch(e => console.log('failed to discover', user.value, e))
})

chrome.runtime.onMessage.addListener((message, sender) => {
  // waiting for the message from token-listener.js
  if (message.rsToken) {
    token.value = message.rsToken
    saveToken(message.rsToken)

    // tell the background page to close the lesspass.alhur.es tab
    if (popupOpened /* prevent us from closing a tab the user have spontaneously
                       opened on lesspass.alhur.es with the extension installed */) {
      chrome.runtime.sendMessage({
        kind: 'close-tab',
        tabId: sender.tab.id
      })
    }
  }
})

chrome.storage.sync.set({seenOptions: true})
