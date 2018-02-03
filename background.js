/* global chrome */

const parse = require('parse-url')
const rs = require('./remotestorage')

chrome.contextMenus.create({
  contexts: [typeof browser === 'undefined' ? 'editable' : 'password'],
  id: 'lesspass-here',
  title: 'LessPass here'
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lesspass-here') {
    chrome.tabs.executeScript(tab.id, {file: '/dist/content-script.js'}, () => {
      if (chrome.runtime.lastError) {
        console.log('problem injecting content-script', chrome.runtime.lastError)
        return
      }
    })

    rs.client.getObject(`hosts/${parse(tab.url).resource}`)
      .then(hostData => {
        console.log('hostData', hostData)
        if (hostData) {
          return Promise.all(
            hostData.profiles.map(prf => rs.client.getObject(`profiles/${prf}`))
          )
        }
      })
      .then(profiles => {
        console.log('profiles', profiles)
        chrome.tabs.sendMessage(tab.id, {
          kind: 'lesspass-here',
          profiles
        })
      })
      .catch(e => console.log('failed to fetch data on host', parse(tab.url).resource, e))
  }
})

chrome.runtime.onMessage.addListener(message => {
  console.log('message!', message)

  if (message.kind === 'to-save') {
    let {host, profile} = message

    rs.client.getObject(`hosts/${host}`)
      .then((hostData = {profiles: []}) => {
        var found = false
        hostData.profiles.forEach(prf => {
          if (prf === `${profile.domain}/${profile.login}`) {
            found = true
          }
        })
        if (!found) {
          hostData.profiles.unshift(`${profile.domain}/${profile.login}`)
          return rs.client.storeObject('host', `hosts/${host}`, hostData)
        }
      })
      .then(() => console.log('updated host', host))
      .catch(e => console.log('failed to update host', host, e))

    rs.client.storeObject('profile', `profiles/${profile.domain}/${profile.login}`, profile)
      .then(() => console.log('updated profile', profile))
      .catch(e => console.log('failed to update profile', profile, e))
  }
})
