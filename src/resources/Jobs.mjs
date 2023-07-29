import { ItemManager } from '@liquid-labs/resource-model'

import { Job } from './Job'

/**
* Public API for managing jobs.
*/
const Jobs = class extends ItemManager {
  constructor(options) {
    super(options)
  }
}

Object.defineProperty(Jobs, 'itemConfig', {
  value        : Job.itemConfig,
  writable     : false,
  enumerable   : true,
  configurable : false
})

export { Jobs }