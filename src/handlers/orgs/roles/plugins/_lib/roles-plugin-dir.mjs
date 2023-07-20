import * as fsPath from 'node:path'

import { LIQ_PLAYGROUND } from '@liquid-labs/liq-defaults'

const rolesPluginDir = ({ orgBit, projectBit }) =>
  fsPath.join(LIQ_PLAYGROUND(), orgBit, projectBit, 'data', 'roles-plugins')

export { rolesPluginDir }
