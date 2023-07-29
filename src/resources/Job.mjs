import { Item } from '@liquid-labs/resource-model'

const Job = class extends Item { }

Item.bindCreationConfig({
  dataCleaner : (data) => { delete data.id; return data },
  itemClass   : Job,
  itemName    : 'job',
  keyField    : 'title',
  itemsName   : 'jobs'
})

export { Job }
