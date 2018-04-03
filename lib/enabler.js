const { link, getList, unlink } = require('./linker')
const { ModuleNotFoundError } = require('./errors')

Promise.complete = require('promise-complete')

const execute = async (action) => {
  const list = await getList()
  const results = await Promise.complete(list.map(async d => action(d)))
  for (const error of results) {
    if (error instanceof ModuleNotFoundError) {
      // Remove path from code-list.
      list.splice(list.indexOf(error.path), 1)
      const json = JSON.stringify(list, 2)
      await execa('npm', ['config', 'set', 'code-list', json])
    }
  }
}

const enable = async () => execute(link)

const disable = async () => execute(unlink)

module.exports = { enable, disable }
