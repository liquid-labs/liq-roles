/* globals beforeAll describe expect test */
import * as fs from 'node:fs'
import * as fsPath from 'node:path'

import yaml from 'js-yaml'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { Roles } from '../Roles'

const mockOrg = {
  roles : null // we'll actually set it up after creating 'roles'
}

describe('Role', () => {
  let roles
  beforeAll(() => {
    const rolesPkgDir = tryExec('npm explore @liquid-labs/liq-test-lib -- \'cd $(pwd)/dist/data/playground-simple/orgA/projectA01/data/roles-plugins && npm explore @liquid-labs/roles-core -- pwd\'')
      .stdout.trim()
    const rolesPath = fsPath.join(rolesPkgDir, 'policy', 'roles.yaml')
    const rolesData = yaml.load(fs.readFileSync(rolesPath, { encoding : 'utf8' }))
    roles = new Roles({ items : rolesData, org : mockOrg })
    mockOrg.roles = roles
  })

  test("'imliedRoleNames' finds implied roles", () => {
    const baseRole = roles.get('Executive Officer')
    const impliedRoleNames = baseRole.allImpliedRoleNames
    expect(impliedRoleNames).toHaveLength(5)
    expect(impliedRoleNames.sort()).toEqual(['Employee', 'Financial', 'Management', 'Senior Management', 'Staff'])
  })
})
