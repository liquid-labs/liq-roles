import { commonOutputConfig, commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { commonRolesOutputParams } from './lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'roles', 'list']
// excludeDesignated, fields, includeIndirect, noHeaders as of 2022-04-30
const parameters = [...commonOutputParams()]
parameters.push(...commonRolesOutputParams)

const mdFormatter = (roles, title) => {
  const markdownBuf = [`# ${title}\n`]
  for (const { name, summary, superRole, implies = [] } of roles) {
    markdownBuf.push(
      `## ${name}\n`,
      '### Summary\n',
      summary + '\n'
    )
    if (superRole || implies.length > 0) {
      markdownBuf.push('### Implies\n')
      if (superRole && implies.findIndex((i) => i.name === superRole.name) === -1) {
        implies.unshift({ name : superRole.name, mngrProtocol : 'self' })
      }
      for (const { name: impliedName } of implies) {
        markdownBuf.push(`- [${impliedName}](#${toKebabCase(impliedName)})`)
      }
      markdownBuf.push('\n')
    }
  }
  return markdownBuf.join('\n')
}

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params : req.vars, res })
  if (org === false) return // error reeportaing already handled

  const roles = org.roles.list(Object.assign({}, req.vars, { clean : true, rawData : true }))

  formatOutput({
    basicTitle : 'Roles Report',
    data       : roles,
    mdFormatter,
    reporter,
    req,
    res,
    ...commonOutputConfig(org.roles, req.query)
  })
}

export {
  func,
  method,
  parameters,
  path
}
