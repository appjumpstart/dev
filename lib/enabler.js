const { link, getList, unlink } = require('./linker')
const { ModuleNotFoundError } = require('./errors')

Promise.complete = require('promise-complete')

module.exports = {
  async execute (action) {
    const list = await getList()
    const results = await Promise.complete(list.map(async d => action(d)))
    results.filter(r => r instanceof Error).forEach(error => {
      if (error instanceof ModuleNotFoundError) {
        // Remove path from code-list.
        list.splice(list.indexOf(error.path), 1)
        const json = JSON.stringify(list, 2)
        await execa('npm', ['config', 'set', 'code-list', json])
      }
    })
  },
  enable: async () => {
    await this.execute(link)
  },
  disable: async () => {
    await this.execute(unlink)
  }
}
