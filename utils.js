const fs = require('fs')

module.exports.icons = [
  fs.readFileSync('vendor/fontawesome/hashtag.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/heart.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/hotel.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/university.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/plug.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/ambulance.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/bus.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/car.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/plane.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/rocket.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/ship.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/subway.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/truck.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/jpy.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/eur.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/btc.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/usd.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/gbp.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/archive.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/area-chart.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/bed.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/beer.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/bell.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/binoculars.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/birthday-cake.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/bomb.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/briefcase.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/bug.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/camera.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/cart-plus.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/certificate.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/coffee.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/cloud.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/coffee.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/comment.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/cube.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/cutlery.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/database.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/diamond.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/exclamation-circle.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/eye.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/flag.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/flask.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/futbol-o.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/gamepad.svg', 'utf-8'),
  fs.readFileSync('vendor/fontawesome/graduation-cap.svg', 'utf-8')
]

module.exports.colors = ['#000000', '#074750', '#009191', '#FF6CB6', '#FFB5DA', '#490092', '#006CDB', '#B66DFF', '#6DB5FE', '#B5DAFE', '#920000', '#924900', '#DB6D00', '#24FE23']

module.exports.selectorFromNode = selectorFromNode
function selectorFromNode (node) {
  if (node.id) {
    return '#' + node.id
  }

  let tag = node.tagName.toLowerCase()

  var special = ''
  if (node.name) {
    special += `[name="${node.name}"]`
  }

  var cls = ''
  if (!special && node.className) {
    cls = node.className.split(/ +/g)
      .map(cls => '.' + cls)
      .join('')
  }

  var pos = ''
  if (!special) {
    var nthoftype = 0
    for (let i = 0; i < node.parentNode.children.length; i++) {
      let child = node.parentNode.children[i]
      if (child.tagName === node.tagName) {
        nthoftype++
      }
      if (node === child) {
        pos = `:nth-of-type(${nthoftype})`
        break
      }
    }
  }

  let sel = tag + special + cls + pos
  if (node.parentNode === document.body) {
    return 'body > ' + sel
  } else {
    return `${selectorFromNode(node.parentNode)} > ${sel}`
  }
}
