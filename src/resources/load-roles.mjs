import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import yaml from 'js-yaml'

import { Roles } from './Roles'

const loadRoles = async({ org }) => {
  const items = []
  for (const { path } of org.rolePlugins) {
    const yamlPath = fsPath.join(path, 'policy', 'roles.yaml')
    let rolesData
    try {
      rolesData = yaml.load(await fs.readFile(yamlPath))
    }
    catch (e) {
      if (e.code === 'ENOENT') {
        try {
          const jsonPath = fsPath.join(path, 'policy', 'roles.json')
          rolesData = yaml.load(await fs.readFile(jsonPath))
        }
        catch (e) {
          if (e.code === 'ENOENT') { continue }
          else { throw e }
        }
      }
      else { throw e }
    }

    items.push(...rolesData)
  }

  const roles = new Roles({ items, org })
  org.bindRootItemManager(roles)
}

export { loadRoles }
