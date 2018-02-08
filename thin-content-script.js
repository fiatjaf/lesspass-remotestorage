/* global browser, Event */

var passwordField

function trackField () {
  if (document.activeElement.type === 'password') {
    passwordField = document.activeElement
  } else {
    passwordField = undefined
  }
}

browser.runtime.onMessage.addListener(message => {
  switch (message.kind) {
    case 'lesspass-here':
      trackField()
      break
    case 'fill-password':
      let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value'
      ).set
      nativeInputValueSetter.call(passwordField, message.password)
      passwordField.dispatchEvent('input', new Event('input', {bubbles: true}))
      passwordField.value = message.password
      break
  }
})

trackField()
