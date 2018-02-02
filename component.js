const choo = require('choo')
const html = require('choo/html')
const lesspass = require('lesspass')
const debounce = require('debounce')

require('./vendor/fontawesome-all.js')

var app = choo()

app.route(location.pathname, main)
app.use(generator)
app.use(fingerprinter)

function main (state, emit) {
  return html`
<div>
  <form onsubmit=${onsubmit}>
    <input value=${state.domain} oninput=${changedomain}>
    <input value=${state.login} oninput=${changelogin}>
    <div>
      <input type=password value=${state.master} oninput=${changemaster}>
      ${state.fingerprint
        ? html`<div class="fingerprint">
            ${state.fingerprint.map(({icon, color}) =>
              html`<i class="fas ${icon}" style="color: ${color}"></i>`
            )}
          </div>`
        : ''
      }
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
        emitter.emit('password', password)
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
          iconAndColor(fingerprint.substring(0, 6)),
          iconAndColor(fingerprint.substring(6, 12)),
          iconAndColor(fingerprint.substring(12, 18))
        ]
        emitter.emit('render')
      })
      .catch(e => console.log('failed to generate fingerprint', e))
  })
}

function iconAndColor (hash) {
  let colors = ['#000000', '#074750', '#009191', '#FF6CB6', '#FFB5DA', '#490092', '#006CDB', '#B66DFF', '#6DB5FE', '#B5DAFE', '#920000', '#924900', '#DB6D00', '#24FE23']
  let icons = ['fa-hashtag', 'fa-heart', 'fa-hotel', 'fa-university', 'fa-plug', 'fa-ambulance', 'fa-bus', 'fa-car', 'fa-plane', 'fa-rocket', 'fa-ship', 'fa-subway', 'fa-truck', 'fa-jpy', 'fa-eur', 'fa-btc', 'fa-usd', 'fa-gbp', 'fa-archive', 'fa-area-chart', 'fa-bed', 'fa-beer', 'fa-bell', 'fa-binoculars', 'fa-birthday-cake', 'fa-bomb', 'fa-briefcase', 'fa-bug', 'fa-camera', 'fa-cart-plus', 'fa-certificate', 'fa-coffee', 'fa-cloud', 'fa-coffee', 'fa-comment', 'fa-cube', 'fa-cutlery', 'fa-database', 'fa-diamond', 'fa-exclamation-circle', 'fa-eye', 'fa-flag', 'fa-flask', 'fa-futbol-o', 'fa-gamepad', 'fa-graduation-cap']

  let n = parseInt(hash, 16)
  return {
    icon: icons[n % icons.length],
    color: colors[n % colors.length]
  }
}

module.exports = app
