const component = require('../component')

document.head.appendChild(component.style)
document.getElementById('widget-here').appendChild(component.start())
