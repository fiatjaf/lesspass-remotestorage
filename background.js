/* global chrome */

const parse = require('url-parse')
const rs = require('./remotestorage')

var domains = null
function loadDomains (cb) {
  if (domains) {
    return cb(domains)
  }

  rs.on('connected', () => {
    rs.client.getListing('domains/')
      .then(res => {
        console.log('listing', res)
        domains = res
        cb(domains)
      })
      .catch(e => console.log('error loading domains/ listing', e))
  })
}

chrome.tabs.onUpdated.addListener((tabId, {status}, tab) => {
  if (status !== 'complete') return
  loadDomains(domains => {
    let url = parse(tab.url)
    if (url.host in domains) {
      rs.client.getObject(`domains/${url.host}`)
        .then(res => {
          console.log('loaded', res)
        })
        .catch(e => console.log('failed loading', `domains/${url.host}`, e))
    }
  })
})

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
      chrome.tabs.sendMessage(tab.id, 'lesspass-here')
    })
  }
})

chrome.runtime.onMessage.addListener(message => {
  console.log('message!', message)

  if (message.page && message.profile) {
    let {page, profile} = message

    rs.client.getObject(`domains/${profile.actual_domain}`)
      .catch(e => console.log('error fetch domain before updating', e))
      .then(domain => {
        domain = domain || {
          pages: [],
          profiles: []
        }

        var foundPage = false
        for (let i = 0; i < domain.pages.length; i++) {
          if (page.url === domain.pages[i].url) {
            foundPage = true
            break
          }
        }

        var foundProfile = false
        for (let i = 0; i < domain.profiles.length; i++) {
          if (profile.actual_domain === domain.profiles[i].actual_domain) {
            foundProfile = true
            break
          }
        }

        if (!foundPage) {
          domain.pages.push(page)
        }

        if (!foundProfile) {
          domain.profiles.push(profile)
        }

        rs.client.storeObject('domain', `domains/${profile.actual_domain}`, domain)
          .then(x => {
            console.log('saved', x)
          })
          .catch(e => console.log('failed to save domain object', e))
      })
  }
})
