import { detailsPluginHandler, detailsPluginSetup } from '@liquid-labs/liq-plugins-lib'

import { installedPluginsRetriever } from './_lib/plugin-retrievers'

const { help, method, parameters } = detailsPluginSetup({ pluginsDesc : 'sever endpoint' })

const path = ['orgs', ':orgKey', 'roles', 'plugins', ':rolePluginName', 'details']

const func = detailsPluginHandler({ installedPluginsRetriever })

export { func, help, method, parameters, path }
