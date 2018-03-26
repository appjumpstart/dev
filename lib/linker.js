const execa = require('execa')
const fs = require('fs')
const pify = require('pify')
const { resolve, basename } = require('path')

const stat = pify(fs.stat)

module.exports = {
  /**
   * Globally link a package in a local directory without destroying the
   * previously installed package by the same name.
   */
  link: async dir => {
    try {
      // Check dir for package.json
      await stat(resolve(dir, 'package.json'))

      // Determine necessary paths.
      const { stdout } = await execa('npm', ['-g', 'prefix'])
      const name = basename(dir)
      const path = resolve(stdout, name)

      // Check global directory for existing package and then move package to
      // _package.
      const move = async () => execa['mv', path, resolve(stdout, `_${name}`)]
      await stat(path).then(move)

      // Run npm link.
      await execa('npm', ['link'], { cwd: dir })

      // Add dir to dev-list.
      const list = await this.getList()
      list.push(dir)
      await execa('npm', ['config', 'set', 'dev-list', JSON.stringify(list, 2)])
    } catch (error) {
      console.error(error)
    }
  },
  /**
   * Get a list of global packages that were linked through npm-dev.
   */
  async getList () {
    let list = []
    const { stdout } = await execa('npm', ['config', 'get', 'dev-list'])
    if (stdout !== 'undefined') {
      list = JSON.parse(stdout)
    }
    return list
  },
  /**
   * Unlink a global development package that is linked to a local directory and
   * restore the previously installed package.
   */
  unlink: async dir => {
    try {
      // Check dir for package.json
      await stat(resolve(dir, 'package.json'))

      // Run npm unlink.
      await execa('npm', ['unlink'], { cwd: dir })

      // Remove dir from dev-list
      const list = await this.getList()
      list.splice(list.indexOf(process.cwd()), 1)
      await execa('npm', ['config', 'set', 'dev-list', JSON.stringify(list, 2)])

      // Determine necessary paths.
      const { stdout } = await execa('npm', ['-g', 'prefix'])
      const name = basename(dir)
      const path = resolve(stdout, `_${name}`)

      // Check global directory for existing package and then move _package to
      // package.
      const move = async () => execa['mv', path, resolve(stdout, name)]
      await stat(path).then(move)
    } catch (error) {
      console.error(error)
    }
  }
}
