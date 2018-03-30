const execa = require('execa')
const fs = require('fs')
const pify = require('pify')
const { resolve, basename } = require('path')
const debug = require('debug')('npm-dev')
const { ModuleNotFoundError } = require('./errors')

const stat = pify(fs.stat)

/**
 * Get a list of global packages that were linked through npm-dev.
 */
const getList = async () => {
  let list = []
  const { stdout } = await execa('npm', ['config', 'get', 'code-list'])
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
  // Check dir for package.json
  try {
    await stat(resolve(dir, 'package.json'))
  } catch (error) {
    debug(error)
    const moduleNotFoundError = new ModuleNotFoundError(null, dir)
    console.error(moduleNotFoundError)
    return moduleNotFoundError
  }

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
    await execa('mv', [path, newPath])
  } catch (error) {
    debug(error, path, newPath)
  }

  // FIXME: Check if module is already linked before running npm link.

  // Run npm link.
  try {
    const link = await execa('npm', ['link'], { cwd: dir })
    console.info(link.stdout)
  } catch (error) {
    debug(error, dir)
  }

  // Add dir to code-list.
  const list = await getList()
  if (!list.includes(dir)) {
    list.push(dir)
    const json = JSON.stringify(list, 2)
    await execa('npm', ['config', 'set', 'code-list', json])
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

    // FIXME: check if link exists before trying to npm unlink.

    // Run npm unlink.
    debug('npm unlink', await execa('npm', ['unlink'], { cwd: dir }))

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
