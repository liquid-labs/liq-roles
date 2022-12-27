import { handlers } from './serviceBundles'

import * as accessMatrix from './matrix'
import * as chdAccess from './chd-access'
import * as listRolesAccess from './list'

handlers.push(accessMatrix)
handlers.push(chdAccess)
handlers.push(listRolesAccess)

export { handlers }
