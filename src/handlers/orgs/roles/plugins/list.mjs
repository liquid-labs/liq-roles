import { listPluginsHandler, listPluginsSetup } from '@liquid-labs/liq-plugins-lib'

import { hostVersionRetriever, installedPluginsRetriever } from './_lib/plugin-retrievers'

const { help, method, parameters } = listPluginsSetup({ pluginsDesc : 'role' })

const path = ['orgs', ':orgKey', 'roles', 'plugins', 'list']

const func = listPluginsHandler({ hostVersionRetriever, installedPluginsRetriever, pluginType : 'roles' })

export { func, help, method, parameters, path }
