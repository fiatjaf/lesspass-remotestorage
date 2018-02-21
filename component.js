const choo = require('choo')
const html = require('choo/html')
const lesspass = require('lesspass')
const debounce = require('debounce')
const deepEqual = require('deep-equal')

var app = choo()

app.route('404', main)
app.use(firstrender)
app.use(controller)
app.use(profileStarter)
app.use(generator)
app.use(fingerprinter)

function main (state, emit) {
  function renderIcon (svg) {
    return html`<img src="data:image/svg+xml;base64,${window.btoa(svg)}">`
  }

  function profileItem (prf, idx, removing) {
    let name = typeof prf === 'string'
      ? prf
      : `${prf.domain}/${prf.login}`

    return removing
      ? html`
      <li>
        <a>Really remove ${name}?</a>
        <a href=#
           class="remove"
           onclick=${reallyremove.bind(null, idx)}>
          yes, remove
        </a>
        <a href=#
           class="cancelremove"
           onclick=${cancelremove}>
          cancel
        </a>
      </li.
      `
      : html`
      <li>
        <a href=# onclick=${selectprofile.bind(null, idx)}>
          ${name}
        </a>
        <a href=#
           class="remove"
           style="display: ${typeof idx === 'undefined' ? 'none' : ''}"
           title="delete this profile"
           onclick=${remove.bind(null, idx)}>
          ×
        </a>
      </li>
    `
  }

  emit('firstrender')

  return html`
<div id=lesspass>
  <div id="controls">
    <a href=#
       onclick=${toggleoptions}
       style="display: ${state.showingprofiles ? 'none' : ''}"
    >${state.showingoptions ? 'close options' : 'show options'}</a>
    <a href=#
       onclick=${toggleprofiles}
       class=${state.showingprofiles ? 'cancel' : ''}
    >${state.showingprofiles ? 'cancel' : 'load profiles'}</a>
  </div>
  <ul id="profiles" style="display: ${state.showingprofiles ? '' : 'none'}">
    ${state.profiles.map((prf, idx) => profileItem(prf, idx, state.confirmingdelete === idx))}
    ${profileItem('default')}
  </ul>
  <form onsubmit=${generate} style="display: ${state.showingprofiles ? 'none' : ''}">
    <input value=${state.domain} oninput=${changedomain}>
    <input value=${state.login} oninput=${changelogin}>
    <div class=master>
      <input type=password
             style="width: ${state.fingerprint ? '265px' : 'auto'}"
             value=${state.master}
             oninput=${changemaster}>
      <div class=fingerprint style="display: ${state.fingerprint ? '' : 'none'}">
        ${(state.fingerprint || []).map(renderIcon)}
      </div>
    </div>
    <div id="options" style="display: ${state.showingoptions ? '' : 'none'}">
      <div>
        <label>a-z
          <input type="checkbox"
                 onchange=${checkoption.bind(null, 'lowercase')}
                 checked=${state.options.lowercase}>
        </label>
        <label>A-Z
          <input type="checkbox"
                 onchange=${checkoption.bind(null, 'uppercase')}
                 checked=${state.options.uppercase}>
        </label>
        <label>0-9
          <input type="checkbox"
                 onchange=${checkoption.bind(null, 'numbers')}
                 checked=${state.options.numbers}>
        </label>
        <label>%!@
          <input type="checkbox"
                 onchange=${checkoption.bind(null, 'symbols')}
                 checked=${state.options.symbols}>
        </label>
      </div>
      <div>
        <label>Length:
          <input type="number"
                 step=1
                 value=${state.options.length}
                 oninput=${changeoption.bind(null, 'length')}
                 min=5>
        </label>
        <label>Counter:
          <input type="number"
                 step=1
                 value=${state.options.counter}
                 oninput=${changeoption.bind(null, 'counter')}
                 min=1>
        </label>
      </div>
    </div>
    ${state.showpassword ? html`<input id="show-password" value=${state.showpassword}>` : html`<button>Generate</button>`}
  </form>
</div>
  `

  function toggleoptions (e) {
    e.preventDefault()
    emit('showingoptions', !state.showingoptions)
  }

  function toggleprofiles (e) {
    e.preventDefault()
    emit('showingprofiles', !state.showingprofiles)
  }

  function selectprofile (idx, e) {
    e.preventDefault()
    emit('selectprofile', idx)
  }

  function remove (idx, e) {
    e.preventDefault()
    emit('remove', idx)
  }

  function reallyremove (idx, e) {
    e.preventDefault()
    emit('reallyremove', idx)
  }

  function cancelremove (e) {
    e.preventDefault()
    emit('cancelremove')
  }

  function changeoption (attr, e) {
    emit('setoption', attr, parseInt(e.target.value))
  }

  function checkoption (attr, e) {
    emit('setoption', attr, e.target.checked)
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

function firstrender (state, emitter) {
  state.firstrender = true

  emitter.on('firstrender', () => {
    if (!state.firstrender) return
    state.firstrender = false

    setTimeout(() => {
      let master = document.querySelector('.master input')
      if (master) {
        master.focus()
      }
    }, 10)
  })
}

function controller (state, emitter) {
  state.showingoptions = false
  state.showingprofiles = false
  state.confirmingdelete = false

  emitter.on('showingoptions', showingoptions => {
    state.showingoptions = showingoptions
    emitter.emit('render')
  })

  emitter.on('showingprofiles', showingprofiles => {
    state.showingprofiles = showingprofiles
    emitter.emit('render')
  })

  emitter.on('selectprofile', idx => {
    let profile = typeof idx === 'undefined'
      ? state.defaultProfile
      : state.profiles[idx]

    chooseProfile(state, profile)
    state.showingprofiles = false
    emitter.emit('render')
  })

  emitter.on('remove', idx => {
    state.confirmingdelete = idx
    emitter.emit('render')
  })

  emitter.on('reallyremove', idx => {
    let name = state.profiles[idx].domain + '/' + state.profiles[idx].login
    emitter.emit('rs-delete', name)
    state.profiles.splice(idx, 1)
    state.confirmingdelete = false
    state.showingprofiles = false
    emitter.emit('render')
  })

  emitter.on('cancelremove', () => {
    state.confirmingdelete = false
    emitter.emit('render')
  })
}

function profileStarter (state, emitter) {
  state.profiles = []

  emitter.on('rs-profiles', profiles => {
    if (!profiles || !Array.isArray(profiles)) return

    state.profiles = profiles

    chooseProfile(state, profiles[0])
    emitter.emit('render')
  })
}

function generator (state, emitter) {
  state.showpassword = null
  state.defaultProfile = {
    domain: location.host,
    login: '',
    options: {
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      length: 16,
      counter: 1,
      version: 2
    }
  }
  chooseProfile(state, state.defaultProfile)

  emitter.on('active-host', host => {
    state.defaultProfile.domain = host
    state.domain = host
    emitter.emit('render')
  })

  emitter.on('setoption', (key, value) => {
    state.showpassword = null
    state.options[key] = value
    emitter.emit('render')
  })

  emitter.on('change', (key, value) => {
    state.showpassword = null
    state[key] = value
    emitter.emit('render')
  })

  emitter.on('generate', debounce(() => {
    state.showpassword = null
    lesspass.generatePassword(state.domain, state.login, state.master, state.options)
      .then(password => {
        emitter.emit('out-password', password)
        emitter.emit('rs-store', state.domain, state.login, state.options)
      })
      .catch(e => console.log('failed to generate password', e))
  }, 400))

  emitter.on('show-password', password => {
    state.showpassword = password
    emitter.emit('render')
  })

  emitter.on('hide-password', password => {
    state.showpassword = null
    emitter.emit('render')
  })
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
  box-shadow: 1px 1px 8px #555;
}

input, p, a {
  font-size: 1.3em;
}

a { text-decoration: none; }

ul, li {
  list-style: none;
  margin: 0;
  padding: 0;
}

#controls {
  display: flex;
  margin-bottom: 8px;
  text-align: right;
}
  #controls a {
    flex: auto;
    padding: 4px;
  }
  #controls a { color: rgba(255, 255, 255, 0.5) }
  #controls a:hover { color: rgba(255, 255, 255, 0.9) }
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
  #profiles .remove,
  #profiles .cancelremove {
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
  #profiles .cancelremove { padding: 9px 11px; }
    #profiles .cancelremove:hover { background-color: rgba(255, 255, 255, 0.6); }
      #profiles .cancelremove:hover a { color: #777; }
    #profiles .cancelremove a {
      background: yellow;
      color: #444;
    }
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
        height: 25px;
        margin: 7px 3px 0 3px;
      }
  form button {
    font-size: 1.5em;
    cursor: pointer;
    background-color: #024379;
    padding-top: 7px;
    padding-bottom: 7px;
    color: white;
    text-align: center;
  }

  #show-password {
    display: block;
    text-align: center;
    padding: 10px;
    color: white;
    background: rgba(255, 255, 255, 0.4);
    font-size: 17px;
    border: dotted 4px;
  }

  #options {}
    #options input {
      padding: 2px;
    }
    #options input:not([type="checkbox"]) {
      width: 45px;
      margin-left: 2px;
    }
    #options > * {
      display: flex;
    }
      #options > * > * {
        flex: auto;
      }
    #options label {
      background: rgba(255, 255, 255, 0.6);
      color: #333;
      margin: 3px;
      padding: 3px;

      display: flex;
    }
      #options label > * {
        flex: auto;
      }
    #options label:first-child { margin-left: 0 }
    #options label:last-child { margin-right: 0 }
`

function chooseProfile (state, profile) {
  if (!profile) return

  state.domain = profile.domain
  state.login = profile.login

  let optionsDifferentThanDefault = !deepEqual(
    profile.options,
    state.defaultProfile.options
  )

  state.options = Object.assign({}, profile.options)
  state.master = ''

  state.showingoptions = optionsDifferentThanDefault
}

module.exports.style = document.createElement('style')
module.exports.style.innerHTML = css
