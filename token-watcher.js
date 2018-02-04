/* global chrome */

console.log('location', location.href, location.hash)
if (location.hash.slice(1, 1 + 'access_token'.length) === 'access_token') {
  let token = location.hash.split('=')[1]
  console.log('token', token)
  chrome.runtime.sendMessage({
    rsToken: token
  })
}
