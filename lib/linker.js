const execa = require('execa')
const fs = require('fs')
const pify = require('pify')
const { resolve, basename } = require('path')
const debug = require('debug')('npm-dev')

const stat = pify(fs.stat)

/**
 * Get a list of global packages that were linked through npm-dev.
 */
const getList = async () => {
  let list = []
  const { stdout } = await execa('npm', ['config', 'get', 'dev-list'])
  if (stdout !== 'undefined') {
    list = JSON.parse(stdout)
  }
  return list
}

/**
 * Globally link a package in a local directory without destroying the
 * previously installed package by the same name.
 */
const link = async dir => {
  try {
    // Check dir for package.json
    await stat(resolve(dir, 'package.json'))

    // Determine necessary paths.
    const prefix = await execa('npm', ['-g', 'prefix'])
    const name = basename(dir)
    const modulesDir = resolve(prefix.stdout, 'lib/node_modules')
    const path = resolve(modulesDir, name)
    const newPath = resolve(modulesDir, `.${name}`)

    // Check global directory for existing package and then move package to
    // .${package}.
    try {
      await stat(path)
      debug('move existing package', await execa('mv', [path, newPath]))
    } catch (error) {
      debug(error)
    }

    // Run npm link.
    debug('npm link', await execa('npm', ['link'], { cwd: dir }))

    // Add dir to dev-list.
    const list = await getList()
    list.push(dir)
    await execa('npm', ['config', 'set', 'dev-list', JSON.stringify(list, 2)])
  } catch (error) {
    console.error(error)
  }
}

/**
 * Unlink a global development package that is linked to a local directory and
 * restore the previously installed package.
 */
const unlink = async dir => {
  try {
    // Check dir for package.json
    await stat(resolve(dir, 'package.json'))

    // Run npm unlink.
    debug('npm unlink', await execa('npm', ['unlink'], { cwd: dir }))

    // Remove dir from dev-list
    const list = await getList()
    list.splice(list.indexOf(process.cwd()), 1)
    await execa('npm', ['config', 'set', 'dev-list', JSON.stringify(list, 2)])

    // Determine necessary paths.
    const prefix = await execa('npm', ['-g', 'prefix'])
    const name = basename(dir)
    const modulesDir = resolve(prefix.stdout, 'lib/node_modules')
    const path = resolve(modulesDir, `.${name}`)
    const newPath = resolve(modulesDir, name)

    // Check global directory for existing package and then move _package to
    // package.
    try {
      await stat(path)
      debug('move back previous package', await execa('mv', [path, newPath]))
    } catch (error) {
      debug(error)
    }
  } catch (error) {
    console.error(error)
  }
}

module.exports = { getList, link, unlink }
