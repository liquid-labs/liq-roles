import { ItemManager } from '@liquid-labs/resource-model'

import { Job } from './Job'

/**
* Public API for managing jobs.
*/
const Jobs = class extends ItemManager {
  #org

  constructor({ org, additionalItemCreationOptions, ...rest }) {
    super(Object.assign(
      {},
      rest,
      {
        additionalItemCreationOptions : Object.assign({}, additionalItemCreationOptions, { org }),
      }
    ))

    this.#org = org
  }
}

Object.defineProperty(Jobs, 'itemConfig', {
  value        : Job.itemConfig,
  writable     : false,
  enumerable   : true,
  configurable : false
})

export { Jobs }