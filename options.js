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

var popup = {close () {}}

button.addEventListener('click', e => {
  e.preventDefault()
  Discover(user.value)
    .then(res => {
      console.log('webfinger for', user.value, res)
      popup = window.open(res.authURL + '?' + [
        'redirect_uri=https://lesspass.alhur.es/',
        'scope=lesspass:rw',
        'client_id=https://lesspass.alhur.es',
        'response_type=token'
      ].join('&'))
    })
    .catch(e => console.log('failed to discover', user.value, e))
})

chrome.runtime.onMessageExternal.addListener((message, sender) => {
  if (sender.url.match(/^https:\/\/lesspass.alhur.es/) && message.rsToken) {
    console.log(message.rsToken)
    token.value = message.rsToken
    saveToken(message.rsToken)
    popup.close()
  }
})

window.addEventListener('message', e => {
  if (e.source.url.match(/^https:\/\/lesspass.alhur.es/) && e.data && e.data.rsToken) {
    console.log(e.data.rsToken)
    token.value = e.data.rsToken
    saveToken(e.data.rsToken)
    popup.close()
  }
})

chrome.storage.sync.set({seenOptions: true})
