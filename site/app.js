const component = require('../component')

let lessPass = document.createElement('div')
let shadow = lessPass.attachShadow({mode: 'closed'})
shadow.appendChild(component.style)
shadow.appendChild(component.start())

document.body.appendChild(lessPass)
