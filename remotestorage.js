/* global chrome */

const RemoteStorage = require('remotestoragejs')

const rs = new RemoteStorage()

rs.access.claim('lesspass', 'rw')
rs.caching.enable('/lesspass/')

module.exports = rs
module.exports.client = rs.scope('/lesspass/')

rs.on('connected', () => {
  const userAddress = rs.remote.userAddress
  console.log(`${userAddress} connected their remote storage.`)
})

chrome.storage.sync.get(['user', 'token'], res => {
  if (chrome.runtime.lastError) {
    console.log('failed to fetch token', chrome.runtime.lastError)
    return
  }
  rs.connect(res.user, res.token)
})

rs.client.declareType('domain', {
  type: 'object',
  properties: {
    pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          url: {
            type: 'string'
          },
          password_field: {
            type: 'string'
          }
        }
      }
    },
    profiles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          actual_domain: {
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
      }
    }
  }
})
