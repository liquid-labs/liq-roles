import { handlers } from './serviceBundles'

import * as listRolesAccess from './list'

handlers.push(listRolesAccess)

export { handlers }
