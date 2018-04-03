const BaseError = require('@ianwalter/base-error')

class ModuleNotFoundError extends BaseError {
  constructor (message, path) {
    super(message || `No package.json found at path ${path}`)
    this.path = path
  }
}

module.exports = { ModuleNotFoundError }
