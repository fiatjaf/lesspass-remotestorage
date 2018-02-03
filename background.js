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
    chrome.tabs.sendMessage(tab.id, {kind: 'lesspass-here'})
    fetchProfiles(parse(tab.url).resource, tab.id)
  }
})

function fetchProfiles (host, tabId) {
  rs.client.getObject(`hosts/${host}`)
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
      chrome.tabs.sendMessage(tabId, {
        kind: 'profiles',
        profiles
      })
    })
    .catch(e => console.log('failed to fetch data on host', host, e))
}

chrome.runtime.onMessage.addListener((message, {url, tab}) => {
  console.log('message!', message)

  var profileName
  let host = parse(url).resource

  switch (message.kind) {
    case 'to-save':
      let {profile} = message
      profileName = `${profile.domain}/${profile.login}`

      Promise.all([
        rs.client.getObject(`hosts/${host}`)
          .then((hostData = {profiles: []}) => {
            var found = false
            hostData.profiles.forEach(prf => {
              if (prf === profileName) {
                found = true
              }
            })
            if (!found) {
              hostData.profiles.unshift(profileName)
              return rs.client.storeObject('host', `hosts/${host}`, hostData)
            }
          })
          .then(() => console.log('updated host', host))
          .catch(e => console.log('failed to update host', host, e)),

        rs.client.storeObject('profile', `profiles/${profileName}`, profile)
          .then(() => console.log('updated profile', profile))
          .catch(e => console.log('failed to update profile', profile, e))
      ])
        .then(() => {
          fetchProfiles(host, tab.id)
        })
      break

    case 'to-delete':
      profileName = message.profileName

      rs.client.getObject(`hosts/${host}`)
        .then((hostData = {profiles: []}) => {
          var idx
          for (let i = 0; i < hostData.profiles.length; i++) {
            if (hostData.profiles[i] === profileName) {
              idx = i
              break
            }
          }

          if (idx !== undefined) {
            hostData.profiles.splice(idx, 1)
            return rs.client.storeObject('host', `hosts/${host}`, hostData)
          }
        })
        .then(() =>
          rs.client.remove(`profiles/${profileName}`)
        )
        .catch(e => console.log('failed to delete profile', profileName, e))
      break
  }
})
