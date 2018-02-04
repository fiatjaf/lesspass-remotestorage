/* global chrome */

const RemoteStorage = require('remotestoragejs')

const rs = new RemoteStorage()

rs.access.claim('lesspass', 'rw')
rs.caching.enable('/lesspass/')
rs.client = rs.scope('/lesspass/')

module.exports = rs

rs.on('error', e => {
  console.log('remoteStorage error:', e)
  if (e.name === 'Unauthorized') {
    localStorage.removeItem('remotestorage:wireclient')
  }
})

rs.on('connected', () => {
  let userAddress = rs.remote.userAddress
  console.log(`${userAddress} connected their remote storage.`)
})

function connect () {
  chrome.storage.sync.get(['user', 'token'], res => {
    if (chrome.runtime.lastError) {
      console.log('failed to fetch token', chrome.runtime.lastError)
      return
    }
    rs.connect(res.user, res.token)
  })
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.onChanged.addListener((change, areaName) => {
    if (areaName === 'sync' && (change.token || change.user)) {
      connect()
    }
  })
}

if (typeof chrome !== 'undefined' && chrome.storage) {
  connect()
}

rs.client.declareType('host', {
  type: 'object',
  properties: {
    profiles: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  }
})
rs.client.declareType('profile', {
  type: 'object',
  properties: {
    domain: {
      type: 'string'
    },
    login: {
      type: 'string'
    },
    options: {
      type: 'object',
      properties: {
        counter: {
          type: 'integer'
        },
        length: {
          type: 'integer'
        },
        lowercase: {
          type: 'boolean'
        },
        uppercase: {
          type: 'boolean'
        },
        numbers: {
          type: 'boolean'
        },
        symbols: {
          type: 'boolean'
        },
        version: {
          type: 'integer'
        }
      }
    }
  }
})

module.exports.fetchProfiles = fetchProfiles
function fetchProfiles (host) {
  console.log('fetching profiles for', host)
  return rs.client.getObject(`hosts/${host}`)
    .then(hostData => {
      if (hostData) {
        return Promise.all(
          hostData.profiles.map(prf => rs.client.getObject(`profiles/${prf}`))
        )
      }
    })
    .catch(e => console.log('failed to fetch data on host', host, e))
}

module.exports.saveProfile = saveProfile
function saveProfile (host, profile) {
  let profileName = `${profile.domain}/${profile.login}`

  return Promise.all([
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
}

module.exports.deleteProfile = deleteProfile
function deleteProfile (host, profileName) {
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
}
