const choo = require('choo')
const html = require('choo/html')
const lesspass = require('lesspass')
const debounce = require('debounce')

var app = choo()

app.route(location.pathname, main)
app.use(generator)

function main (state, emit) {
  return html`
<div>
  <form onsubmit=${onsubmit}>
    <input value=${state.domain} oninput=${changedomain}>
    <input value=${state.login} oninput=${changelogin}>
    <input type=password value=${state.master} oninput=${changemaster}>
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

module.exports = app
