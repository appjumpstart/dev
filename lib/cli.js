const minimist = require('minimist')
const linker = require('./linker')
const main = require('./main')

module.exports = () => {
  const { _ } = minimist(process.argv.slice(2))
  if (_.includes('link')) {
    linker.link(process.cwd())
  } else if (_.includes('unlink')) {
    linker.unlink(process.cwd())
  } else if (_.includes('enable')) {
    main.enable()
  } else if (_.includes('disable')) {
    main.disable()
  } else {
    console.warn('Say what now?')
  }
}
