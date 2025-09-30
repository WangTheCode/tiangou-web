import Cache from '../utils/cache'
import SensitiveWordTool from 'sensitive-word-tool'
import tsddApi from '../api/tsdd'

export class ProhibitwordsService {
  constructor() {
    this.sensitiveWordTool = new SensitiveWordTool({})
    this.prohibitwords = []
  }

  static shared = new ProhibitwordsService()

  // 同步敏感词
  async sync() {
    this.load()
    this.refresh()
    let lastVersion = 0
    if (this.prohibitwords.length > 0) {
      lastVersion = this.prohibitwords[this.prohibitwords.length - 1].version
    }
    const results = await tsddApi.reminderSync({
      param: {
        version: lastVersion,
      },
    })
    if (results && results.length > 0) {
      for (const result of results) {
        if (result.version > lastVersion) {
          this.prohibitwords.push(result)
        }
      }
      this.save()
      this.refresh()
    }
  }
  // 从存储加载敏感词
  load() {
    const prohibitwordsJson = Cache.get('prohibitwords')
    if (prohibitwordsJson && prohibitwordsJson.length > 0) {
      this.prohibitwords = JSON.parse(prohibitwordsJson)
    }
  }
  save() {
    Cache.set('prohibitwords', JSON.stringify(this.prohibitwords))
  }
  refresh() {
    const words = this.prohibitwords.map(item => {
      return item.content
    })
    this.sensitiveWordTool.addWords(words)
  }
  filter(v) {
    return this.sensitiveWordTool.filter(v)
  }
}
