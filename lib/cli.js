const program = require('caporal')
const pkg = require('../package.json')
const { link, unlink, enable, disable } = require('./')

module.exports = () => {
  program
    .version(pkg.version)
    .command('link', '') // FIXME: Add option to specify directory.
    .action((args, options, logger) => {
      link(process.cwd())
    })
    .command('unlink', '')
    .action((args, options, logger) => {
      unlink(process.cwd())
    })
    .command('enable', '')
    .action((args, options, logger) => {
      enable()
    })
    .command('disable', '')
    .action((args, options, logger) => {
      disable()
    })

  program.parse(process.argv)
}
