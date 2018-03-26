const { link, getList, unlink } = require('./linker')

Promise.complete = require('promise-complete')

module.exports = {
  async execute (action) {
    const list = await getList()
    const results = await Promise.complete(list.map(async d => action(d)))
    results.filter(r => r).array.forEach(e => console.error(e))
  },
  enable: async () => {
    await this.execute(link)
  },
  disable: async () => {
    await this.execute(unlink)
  }
}
