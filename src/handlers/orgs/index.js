import { handlers as jobsHandlers } from './jobs'
import { handlers as rolesHandlers } from './roles'
import { handlers as staffHandlers } from './staff'

const handlers = rolesHandlers.concat(staffHandlers).concat(jobsHandlers)

export { handlers }
