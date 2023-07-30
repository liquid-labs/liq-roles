import { Item } from '@liquid-labs/resource-model'

const Job = class extends Item {
  #org

  constructor(data, { org }) {
    super(data)

    this.#org = org
  }

  validate({ errors = [], warnings = []}) {
    if (this.roles === undefined) {
      errors.push(`Job ${this.title} does not define any roles.`)
    }
    for (const r of this.roles) {
      const role = this.#org.roles.get(r, { fuzzy: true, rawData: true })
      if (role === undefined) {
        errors.push(`Job ${this.title} refererences unknown role '${r}'.`)
      }
    }

    return { errors, warnings }
  }
}

Item.bindCreationConfig({
  dataCleaner : (data) => { delete data.id; return data },
  itemClass   : Job,
  itemName    : 'job',
  keyField    : 'title',
  itemsName   : 'jobs'
})

export { Job }
