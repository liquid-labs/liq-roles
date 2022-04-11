import { handlers } from './access'
import * as getRole from './get'
import * as listRoles from './list'

handlers.push(getRole, listRoles)

export { handlers }
