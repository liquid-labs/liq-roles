/* globals beforeAll describe expect test */
import * as fs from 'node:fs'
import * as fsPath from 'node:path'

import { playgroundSimplePath } from '@liquid-labs/liq-test-lib'

import { Roles } from '../Roles'

const rolesDataPath = fsPath.join(playgroundSimplePath, 'orgA', 'projectA01', 'data', 'orgs', 'roles', 'roles.json')

const mockOrg = {
  roles : null // we'll actually set it up after creating 'roles'
}

describe('Role', () => {
  let roles
  beforeAll(() => {
    roles = new Roles({ items : JSON.parse(fs.readFileSync(rolesDataPath)), org : mockOrg })
    mockOrg.roles = roles
  })

  test("'imliedRoleNames' finds implied roles", () => {
    const baseRole = roles.get('CEO')
    const impliedRoleNames = baseRole.allImpliedRoleNames
    expect(impliedRoleNames).toHaveLength(1)
    expect(impliedRoleNames).toEqual(['Executive Officer'])
  })
})
