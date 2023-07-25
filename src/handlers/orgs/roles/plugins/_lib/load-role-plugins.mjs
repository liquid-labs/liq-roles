import * as fs from 'node:fs'
import * as fsPath from 'node:path'

import findPlugins from 'find-plugins'

import { rolesPluginDir } from './roles-plugin-dir'

const loadRolePlugins = async({ model, orgKey, reporter }) => {
  const org = model.orgs[orgKey]
  if (org === undefined) return

  org.rolePlugins = []

  const rolesProject = org.getSetting('org.STAFF_REPO')
  if (rolesProject === undefined) {
    return
  }
  const [orgBit, projectBit] = rolesProject.split('/')

  const pluginPath = rolesPluginDir({ orgBit, projectBit })
  const pluginPkg = fsPath.join(pluginPath, 'package.json')
  const pluginDir = fsPath.join(pluginPath, 'node_modules')

  if (!fs.existsSync(pluginPkg) || !fs.existsSync(pluginDir)) {
    return
  }

  reporter.log(`Searching for roles plugins (in ${fsPath.dirname(pluginDir)})...`)

  const pluginOptions = {
    pkg    : pluginPkg, // will load dependencies as plugins
    dir    : pluginDir, // will load from here
    filter : () => true // every dependency is a plugin
  }

  const plugins = findPlugins(pluginOptions)

  for (const { dir, pkg } of plugins) {
    const { main, name: npmName, version } = pkg

    const importPath = fsPath.join(dir, main)
    const { name = 'UNKNOWN', summary = 'NONE' } = require(importPath) // await import(`${dir}/${main}`) || {}

    org.rolePlugins.push({ name, summary, npmName, path : dir, version })
  }
}

export { loadRolePlugins }
