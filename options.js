/* global chrome */

let token = document.querySelector('[name="token"]')
let user = document.querySelector('[name="user"]')

chrome.storage.sync.get(['user', 'token'], res => {
  user.value = res.user
  token.value = res.token
})

user.addEventListener('user', e => {
  let user = e.target.value
  chrome.storage.sync.set({user}, () => {
    if (chrome.runtime.lastError) {
      console.log('failed to save user', chrome.runtime.lastError)
    }
    console.log('saved user', user)
  })
})

token.addEventListener('token', e => {
  let token = e.target.value
  chrome.storage.sync.set({token}, () => {
    if (chrome.runtime.lastError) {
      console.log('failed to save token', chrome.runtime.lastError)
    }
    console.log('saved token', token)
  })
})
