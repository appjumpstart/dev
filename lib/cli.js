const minimist = require('minimist')
const { link, unlink, enable, disable } = require('./')

module.exports = () => {
  const { _ } = minimist(process.argv.slice(2))
  if (_.includes('link')) {
    link(process.cwd())
  } else if (_.includes('unlink')) {
    unlink(process.cwd())
  } else if (_.includes('enable')) {
    enable()
  } else if (_.includes('disable')) {
    disable()
  } else {
    console.warn('Say what now?')
  }
}
