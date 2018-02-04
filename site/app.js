const Widget = require('remotestorage-widget')
const debounce = require('debounce')

const component = require('../component')
const rs = require('../remotestorage')
const {fetchProfiles, saveProfile, deleteProfile} = require('../remotestorage')

const widget = new Widget(rs)
widget.attach()

document.head.appendChild(component.style)
document.getElementById('widget-here').appendChild(component.start())

rs.on('connected', () => {
  component.use(function (state, emitter) {
    const dFetchProfiles = debounce(fetchProfiles, 1000)

    emitter.on('change', (key, value) => {
      if (key === 'domain') {
        dFetchProfiles(value)
          .then(profiles => {
            emitter.emit('rs-profiles', profiles)
          })
      }
    })

    emitter.on('rs-store', (domain, login, options) => {
      saveProfile({domain, login, options})
    })

    emitter.on('rs-delete', profileName => {
      deleteProfile(state.domain, profileName)
    })
  })
})

// send password back
component.use(function (_, emitter) {
  emitter.on('out-password', password => {
    emitter.emit('show-password', password)
  })
})
