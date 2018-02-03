const choo = require('choo')
const html = require('choo/html')
const lesspass = require('lesspass')
const debounce = require('debounce')

var app = choo()

app.route(location.pathname, main)
app.use(profileStarter)
app.use(generator)
app.use(fingerprinter)

function main (state, emit) {
  return html`
<div id=lesspass>
  
  <form onsubmit=${onsubmit}>
    <input value=${state.domain} oninput=${changedomain}>
    <input value=${state.login} oninput=${changelogin}>
    <div class=master>
      <input type=password value=${state.master} oninput=${changemaster}>
      <div class=fingerprint style="display: ${state.fingerprint ? 'block' : 'none'}">
        ${(state.fingerprint || []).map(icon =>
          html`<img src="data:image/svg+xml;utf-8,${icon}">`
        )}
      </div>
    </div>
    <button>Generate</button>
  </form>
</div>
  `

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

  function onsubmit (e) {
    e.preventDefault()
    emit('generate')
  }
}

function profileStarter (state, emitter) {
  emitter.on('profiles', profiles => {
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
        emitter.emit('password', password, state.domain, state.login, state.options)
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
}
form {
  display: flex;
  flex-direction: column;

  background-color: #3398EB;
  margin: 3px;
  padding: 16px 14px;
  border-radius: 6px;
  font-size: 1.1em;
  box-shadow: 1px 1px 8px #555;
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
