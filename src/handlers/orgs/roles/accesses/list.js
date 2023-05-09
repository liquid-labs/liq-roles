import { toCamelCase, toKebabCase } from 'js-convert-case'

import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from './_lib/roles-access-lib'
import { commonRolesOutputParams } from '../lib'
import * as transforms from './_transforms'

const method = 'get'
const path = ['orgs', ':orgKey', 'roles', 'accesses', 'list?']

const parameters = commonOutputParams()

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params : req.vars, res })
  if (org === false) return // error responsd handled by lib

  const rolesAccess = initializeRolesAccess(org)

  return formatOutput({
    basicTitle : 'Role Access Report', // <- ignored if 'reportTitle' set
    data       : rolesAccess.accessRules,
    dataFlattener,
    mdFormatter,
    reporter,
    req,
    res,
    ...req.vars /* fields, format, output, reportTitle */
  })
}

const dataFlattener = ({ role, policy = [], access = [] }) => ({
  role,
  policy : policy.join(';'),
  access : access.map(({ serviceBundle, type }) => `${serviceBundle}/${type}`)
})

const mdAccessMapper = ({ serviceBundle, type }) => `${type} access to ${serviceBundle}`

const mdFormatter = (accessRules, title) => {
  const markdownBuf = [`# ${title}\n`]
  for (const { role, policy = [], access = [] } of accessRules) {
    markdownBuf.push(
      `## ${role}\n`,
      `Must read policies: ${policy.length === 0 ? '**NONE**' : '\n- ' + policy.join('\n- ')}`,
      '\n',
      `Has accesses to: ${access.length === 0 ? '**NOTHING**' : '\n- ' + access.map(mdAccessMapper).join('\n- ')}`,
      '\n'
    )
  }
  return markdownBuf.join('\n')
}

export { func, parameters, path, method }
