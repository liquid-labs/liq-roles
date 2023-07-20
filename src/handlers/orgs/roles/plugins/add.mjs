import { addPluginsHandler, addPluginsSetup } from '@liquid-labs/liq-plugins-lib'

import { loadRolePlugins } from './_lib/load-role-plugins'
import { hostVersionRetriever, installedPluginsRetriever, pluginPkgDirRetriever } from './_lib/plugin-retrievers'

const pluginsDesc = 'roles'

const { help, method, parameters } =
  addPluginsSetup({ hostVersionRetriever, pluginsDesc, pluginType : 'roles' })

const path = ['orgs', ':orgKey', 'roles', 'plugins', 'add']

const func = addPluginsHandler({
  hostVersionRetriever,
  installedPluginsRetriever,
  pluginsDesc,
  pluginPkgDirRetriever,
  pluginType : 'roles',
  reloadFunc : loadRolePlugins
})

export { func, help, method, parameters, path }
