import { toCamelCase, toKebabCase } from 'js-convert-case'

import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from './_lib/roles-access-lib'
import { commonRolesOutputParams } from '../lib'
import * as transforms from './_transforms'

const method = 'get'
const path = '/orgs/:orgKey/roles/access(/list)?'
const parameters = commonOutputParams()
parameters.push(...commonRolesOutputParams)
parameters.push({
  name: 'includeSource',
  required: false,
  isBoolean: true,
  description: "If true, then will indicate the role directly granting access, where applicable."
})

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) { // TODO: check; I think 'getOrgFromKey' handles the error msg
    return
  }
  
  const rolesAccess = initializeRolesAccess(org)
  
  const { transform, ...rest } = req.query
  
  return transform === undefined
    ? formatOutput({
      basicTitle: 'Role Access Report', // <- ignored if 'reportTitle' set
      data: rolesAccess.accessRules,
      dataFlattener,
      mdFormatter,
      reporter,
      req,
      res,
      ...rest /* fields, format, output, reportTitle */
    })
    : applyTransform({ model, org, reporter, req, res, rolesAccess, transformName: transform, ...rest })
}

const dataFlattener = ({ role, policy=[], access=[] }) => ({
  role,
  policy: policy.join(';'),
  access: access.map(({ serviceBundle, type }) => `${serviceBundle}/${type}`)
})

const mdAccessMapper = ({ serviceBundle, type }) => `${type} access to ${serviceBundle}`

const mdFormatter = (accessRules, title) => {
  const markdownBuf = [`# ${title}\n`]
  for (const { role, policy=[], access=[] } of accessRules) {
    markdownBuf.push(
      `## ${role}\n`,
      `Must read policies: ${policy.length === 0 ? '**NONE**': '\n- ' + policy.join('\n- ')}`,
      '\n',
      `Has accesses to: ${access.length === 0 ? '**NOTHING**': '\n- ' + access.map(mdAccessMapper).join('\n- ')}`,
      '\n'
    )
  }
  return markdownBuf.join("\n")
}

const applyTransform = ({ res, transformName, ...transformOptions }) => {
  const camelName = toCamelCase(transformName)
  const transform = transforms[camelName]
  if (transform === undefined) {
    res.status(400)
      .json({ message: `Uknown transform'${transformName}'; try one of: ${Object.keys(transforms).map(t => toKebabCase(t)) }` })
    return
  }
  
  transform({ res, ...transformOptions })
}

export { func, path, method }
