const choo = require('choo')
const html = require('choo/html')
const lesspass = require('lesspass')
const debounce = require('debounce')

var app = choo()

app.route(location.pathname, main)
app.use(controller)
app.use(profileStarter)
app.use(generator)
app.use(fingerprinter)

function main (state, emit) {
  function profileItem (prf, idx) {
    return html`
      <li>
        <a href=# onclick=${load.bind(null, idx)}>
          ${prf.domain}/${prf.login}
        </a>
        <a href=#
           class="remove"
           title="delete this profile"
           onclick=${remove.bind(null, idx)}>
          ×
        </a>
      </li>
    `
  }

  return html`
<div id=lesspass>
  <div id="controls">
    <a href=#
       onclick=${toggleloading}
       class=${state.loading ? 'cancel' : 'load'}
    >${state.loading ? 'cancel' : 'load profiles'}</a>
  </div>
  <ul id="profiles" style="display: ${state.loading ? '' : 'none'}">
    ${state.profiles.map(profileItem)}
  </ul>
  <form onsubmit=${generate} style="display: ${state.loading ? 'none' : ''}">
    <input value=${state.domain} oninput=${changedomain}>
    <input value=${state.login} oninput=${changelogin}>
    <div class=master>
      <input type=password value=${state.master} oninput=${changemaster}>
      <div class=fingerprint style="display: ${state.fingerprint ? '' : 'none'}">
        ${(state.fingerprint || []).map(icon =>
          html`<img src="data:image/svg+xml;utf-8,${icon}">`
        )}
      </div>
    </div>
    <button>Generate</button>
  </form>
</div>
  `

  function toggleloading (e) {
    e.preventDefault()
    emit('loading', !state.loading)
  }

  function load (idx, e) {
    e.preventDefault()
    emit('load', idx)
  }

  function remove (idx, e) {
    e.preventDefault()
    emit('remove', idx)
  }

  function changedomain (e) {
    emit('change', 'domain', e.target.value)
  }

  function changelogin (e) {
    emit('change', 'login', e.target.value)
  }

  function changemaster (e) {
    emit('change', 'master', e.target.value)
    emit('fingerprint', e.target.value)
  }

  function generate (e) {
    e.preventDefault()
    emit('generate')
  }
}

function controller (state, emitter) {
  state.loading = false

  emitter.on('loading', loading => {
    state.loading = loading
    emitter.emit('render')
  })

  emitter.on('load', idx => {
    let profile = state.profiles[idx]
    chooseProfile(state, profile)
    state.loading = false
    emitter.emit('render')
  })

  emitter.on('remove', idx => {
    let name = state.profiles[idx].domain + '/' + state.profiles[idx].login
    if (confirm(`Delete the ${name} profile from remoteStorage?`)) {
      emitter.emit('rs-delete', name)
      state.profiles.splice(idx, 1)
      state.loading = false
      emitter.emit('render')
    }
  })
}

function profileStarter (state, emitter) {
  state.profiles = []

  emitter.on('rs-profiles', profiles => {
    state.profiles = profiles

    chooseProfile(state, profiles[0])
    emitter.emit('render')
  })
}

function generator (state, emitter) {
  state.domain = location.host
  state.login = ''
  state.master = ''
  state.options = {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    length: 16,
    counter: 1,
    version: 2
  }

  emitter.on('change', (key, value) => {
    state[key] = value
    emitter.emit('render')
  })

  emitter.on('generate', debounce(() => {
    lesspass.generatePassword(state.domain, state.login, state.master, state.options)
      .then(password => {
        emitter.emit('out-password', password)
        emitter.emit('rs-store', state.domain, state.login, state.options)
      })
      .catch(e => console.log('failed to generate password', e))
  }, 400))
}

function fingerprinter (state, emitter) {
  state.fingerprint = null

  emitter.on('fingerprint', master => {
    if (!master.trim()) {
      state.fingerprint = null
      emitter.emit('render')
    }

    lesspass.createFingerprint(master)
      .then(fingerprint => {
        state.fingerprint = [
          icon(fingerprint.substring(0, 6)),
          icon(fingerprint.substring(6, 12)),
          icon(fingerprint.substring(12, 18))
        ]
        emitter.emit('render')
      })
      .catch(e => console.log('failed to generate fingerprint', e))
  })
}

function icon (hash) {
  const {icons, colors} = require('./utils')

  let n = parseInt(hash, 16)
  let icon = icons[n % icons.length]
  let color = colors[n % colors.length]

  return icon.replace(/fill="[^"]+"/, `fill="${color}"`)
}

module.exports = app

let css = `
* {
  box-sizing: border-box;
  font-family: Ubuntu, Arial, sans-serif;
}

#lesspass {
  background-color: #3398EB;
  margin: 3px;
  padding: 16px 14px;
  border-radius: 6px;
  font-size: 1.1em;
  box-shadow: 1px 1px 8px #555;
}

a { text-decoration: none; }

ul, li {
  list-style: none;
  margin: 0;
  padding: 0;
}

#controls {
  text-align: right;
  margin-bottom: 12px;
}
  #controls a {
    padding: 4px;
  }
  #controls a.load { color: rgba(255, 255, 255, 0.5) }
  #controls a.load:hover { color: rgba(255, 255, 255, 0.9) }
  #controls a.cancel { color: rgba(226, 210, 75, 0.7) }
  #controls a.cancel:hover { color: rgba(226, 210, 75, 1) }

#profiles {
  display: flex;
  flex-direction: column;
}
  #profiles > * {
    flex: auto;
  }
  #profiles li {
    margin: 2px;
    display: flex;
    justify-content: space-between;
  }
    #profiles li > * {
      display: flex;
    }
  #profiles a {
    padding: 2px;
    color: rgba(255, 255, 255, 0.7);
  }
  #profiles a:hover { color: rgba(255, 255, 255, 1) }
  #profiles .remove {
    border-radius: 100px;
    line-height: 10px;
    padding: 7px 9px;
    margin-left: 20px;
    background-color: rgba(255, 255, 255, 0.5);
    color: #333;
  }
    #profiles .remove a { color: #333; }
    #profiles .remove:hover {
      background-color: rgba(255, 255, 255, 0.9);
    }
      #profiles .remove:hover a { color: #777; }
form {
  display: flex;
  flex-direction: column;
}
  form > * {
    flex: auto;
    margin-top: 8px;
  }
  form input, form button {
    border: 0;
    padding: 6px;
  }
  .master {
    display: flex;
  }
    .master > * {
      flex: auto;
    }
    .fingerprint {
      margin-left: 2px;
      padding: 0 2px;
    }
      .fingerprint img {
        height: 15px;
        margin: 7px 3px 0 3px;
      }
  form button {
    font-size: 1.5em;
    cursor: pointer;
    background-color: #024379;
    padding-top: 7px;
    padding-bottom: 7px;
    color: white;
  }
`

function chooseProfile (state, profile) {
  state.domain = profile.domain
  state.login = profile.login
  state.options = profile.options
  state.master = ''
}

module.exports.style = document.createElement('style')
module.exports.style.innerHTML = css
