/* global browser */

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
      passwordField.value = message.password
      break
  }
})

trackField()
