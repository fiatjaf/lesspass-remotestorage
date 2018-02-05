/* global browser, chrome */

const parse = require('parse-url')
const isFirefox = require('is-firefox')
const {fetchProfiles, saveProfile, deleteProfile} = require('./remotestorage')

chrome.contextMenus.create({
  contexts: [typeof browser === 'undefined' ? 'editable' : 'password'],
  id: 'lesspass-here',
  title: 'LessPass here'
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'lesspass-here') {
    lessPassHere(tab)
  }
})

chrome.browserAction.onClicked.addListener(tab => {
  lessPassHere(tab)
})

// client is either the popup (on firefox) or
// the content-script that will render the widget (on chrome)
var clientReady
var waitClient = new Promise(resolve => {
  clientReady = resolve
})

function lessPassHere (tab) {
  let host = parse(tab.url).resource

  if (isFirefox) {
    browser.browserAction.setPopup({tabId: tab.id, popup: 'popup.html'})
    browser.browserAction.openPopup()
      .catch(e => console.log("didn't open the browserAction on", host))

    // every time we open the popup we must wait for the client to be ready again
    waitClient = new Promise(resolve => {
      clientReady = resolve
    })
  }

  chrome.tabs.executeScript(tab.id, {
    file: isFirefox ? 'thin-content-script.js' : '/dist/content-script.js'
  }, () => {
    if (chrome.runtime.lastError) {
      console.log('problem injecting content-script', chrome.runtime.lastError)
      return
    }
  })

  // after injecting, send some useful data
  waitClient.then(() => {
    chrome.tabs.sendMessage(tab.id, {kind: 'lesspass-here'})

    if (isFirefox) {
      browser.runtime.sendMessage({kind: 'active-host', host})
    }
  })

  // finally fetch the profiles from remoteStorage and send them also
  Promise.all([
    fetchProfiles(host),
    waitClient
  ])
    .then(([profiles]) => sendProfiles(profiles, tab.id))
    .catch(e => console.log('failed to fetch profiles', host, e))
}

chrome.runtime.onMessage.addListener((message, {url, tab}) => {
  console.log('background message!', message)

  // when the message comes from the popup we won't
  // have the `url` or the `tab` here, 
  Promise.resolve()
    .then(() => {
      if (tab) {
        return {
          host: parse(url).resource,
          tab
        }
      }

      return browser.tabs.query({currentWindow: true, active: true})
        .then(([tab]) => ({
          host: parse(tab.url).resource,
          tab
        }))
    })
    .then(({host, tab}) => {
      switch (message.kind) {
        case 'to-save':
          let {profile} = message
          saveProfile(host, profile)
            .then(() => fetchProfiles(host))
            .then(profiles => sendProfiles(profiles, tab.id))
            .catch(e => console.log('failed to save profile', host, profile, e))
          break

        case 'to-delete':
          let profileName = message.profileName
          deleteProfile(host, profileName)
            .catch(e => console.log('failed to delete profile', profileName, e))
          break

        case 'close-tab':
          console.log('closing tab', message.tabId)
          chrome.tabs.remove(message.tabId, () => {
            if (chrome.runtime.lastError) {
              console.log('failed to close tab', message.tabId, chrome.runtime.lastError)
            }
          })
          break

        case 'client-ready':
          clientReady()

          if (isFirefox) {
            // for some reason this isn't being called on subsequent browserAction
            // clicks, so let's call it here.
            lessPassHere(tab)
          }
          break

        case 'fill-password':
          // proxy this from popup.js to thin-content-script.js
          browser.tabs.sendMessage(tab.id, message)
          break
      }
    })
})

function sendProfiles (profiles, tabId) {
  if (isFirefox) {
    return browser.runtime.sendMessage({kind: 'profiles', profiles})
  } else {
    return chrome.tabs.sendMessage(tabId, {kind: 'profiles', profiles})
  }
}

// show the options page on install
chrome.storage.sync.get(['user', 'token'], ({token, user}) => {
  if (chrome.runtime.lastError) return

  if (!token || !user) {
    chrome.storage.sync.get('seenOptions', ({seenOptions}) => {
      if (chrome.runtime.lastError) return
      if (!seenOptions) {
        chrome.tabs.create({
          url: '/options.html'
        })
      }
    })
  }
})
