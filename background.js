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
