/* globals beforeAll describe expect test */
import * as fs from 'node:fs'
import * as fsPath from 'node:path'

import yaml from 'js-yaml'

import { tryExec } from '@liquid-labs/shell-toolkit'

import { Roles } from '../Roles'

const /* mock */org = {}

describe('Roles', () => {
  let testRoles
  beforeAll(() => {
    const rolesPkgDir = tryExec('npm explore @liquid-labs/liq-test-lib -- \'cd $(pwd)/dist/data/playground-simple/orgA/projectA01/data/roles-plugins && npm explore @liquid-labs/roles-core -- pwd\'')
      .stdout.trim()
    const rolesPath = fsPath.join(rolesPkgDir, 'policy', 'roles.yaml')
    const rolesData = yaml.load(fs.readFileSync(rolesPath, { encoding : 'utf8' }))
    testRoles = new Roles({ items : rolesData, org })
  })

  test('parses test file', () => {
    expect(testRoles).toBeTruthy()
    expect(testRoles.list()).toHaveLength(14)
  })

  describe('list', () => {
    // CEO is first in the underlying list
    test("respects 'sort=false' option", () =>
      expect(testRoles.list({ sort : false }).some((r) => r.name === 'Staff')).toBe(true))

    test("respects 'excludeDesignated=true' option", () => {
      const roles = testRoles.list({ excludeDesignated : true })
      expect(roles).toHaveLength(7) // 7 of 14 are designated
      for (const role of roles) {
        expect(role.designated).toBe(undefined)
      }
    })

    test("'notTitular=true' excludes titular roles", () => {
      const roles = testRoles.list({ excludeTitular : true })
      expect(roles).toHaveLength(7) // 7 of 14 are titular
      for (const role of roles) {
        expect(role.designated).toBe(true)
      }
    })

    test("'notTitular=true' and 'includeIndirect=true' excludes titular roles", () => {
      const roles = testRoles.list({ excludeTitular : true, includeIndirect : true })
      expect(roles).toHaveLength(7) // 7 of 14 are titular
      for (const role of roles) {
        expect(role.designated).toBe(true)
      }
    })
  })
})
