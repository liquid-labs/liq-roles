import { toCamelCase, toKebabCase } from 'js-convert-case'

import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from './_lib/roles-access-lib'
import { commonRolesOutputParams } from '../lib'
import { accessMatrix } from './_transforms'

const method = 'get'
const path = [ 'orgs', ':orgKey', 'roles', 'access', 'matrix' ]
const parameters = commonOutputParams()
parameters.push(...commonRolesOutputParams)
parameters.push({
  name: 'includeSource',
  required: false,
  isBoolean: true,
  description: "If true, then will indicate the role directly granting access, where applicable."
})

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.vars, res })
  if (org === false) return // error response handled by lib
  
  const rolesAccess = initializeRolesAccess(org)

  return accessMatrix({ org, res, ...req.vars, rolesAccess })
}

export { func, parameters, path, method }
