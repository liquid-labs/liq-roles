import { removePluginsHandler, removePluginsSetup } from '@liquid-labs/liq-plugins-lib'

import { loadRolePlugins } from './_lib/load-role-plugins'
import { installedPluginsRetriever, pluginPkgDirRetriever } from './_lib/plugin-retrievers'

const { help, method, parameters } = removePluginsSetup({ pluginsDesc : 'sever endpoint' })

const path = ['orgs', ':orgKey', 'roles', 'plugins', ':rolePluginName', 'remove']

const func = removePluginsHandler({
  installedPluginsRetriever,
  nameKey    : 'rolesPluginName',
  pluginPkgDirRetriever,
  reloadFunc : loadRolePlugins
})

export { func, help, method, parameters, path }
