import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { commonRolesOutputParams } from './lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'roles', 'list']
// excludeDesignated, fields, includeIndirect, noHeaders as of 2022-04-30
const parameters = [...commonOutputParams()]
parameters.push(...commonRolesOutputParams)

const pageFormatter = ({ data: roles, title, h1 = '', h1End = '', h2 = '', h2End = '', em = '', emEnd = '' }) => {
  const lines = []
  if (title !== undefined) {
    lines.push(`${h1}${title}${h1End}\n\n`)
  }
  for (const { name, summary, implies } of roles) {
    lines.push(
      `${h2}${name}${h2End}\n\n`,
      `${em}Summary${emEnd}\n`,
      summary + '\n\n'
    )
    if (implies !== undefined) {
      lines.push(`${em}Implies${emEnd}\n`)
      for (const impliedName of implies) {
        lines.push(`- ${impliedName}\n`)
      }
      lines.push('\n')
    }
  }
  lines.pop() // last '\n' is unecessary
  return lines.join('')
}

const listFormatter = ({ data: roles, h1 = '', h1End = '', h2 = '', h2End = '', em = '', emEnd = '' }) => {
  let output = ''
  for (const { name, summary, implies } of roles) {
    output += `- ${h2}${name}${h2End}: ${summary}`
    if (implies !== undefined) {
      output += `\n  ${em}Implies:${emEnd} ${implies.join(', ')}\n`
    }
    else {
      output += '\n'
    }
  }
  return output
}

const mdFormatter = ({ data, title }) => pageFormatter({ data, title, h1 : '# ', h2 : '## ', em : '### ' })

const terminalFormatter = ({ data }) =>
  listFormatter({ data, h1 : '<h1>', h1End : '<rst>', h2 : '<h2>', h2End : '<rst>', em : '<em>', emEnd : '<rst>' })

const textFormatter = ({ data }) => listFormatter({ data })

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params : req.vars, res })
  if (org === false) return // error reeportaing already handled

  const roles = org.roles.list(Object.assign({}, req.vars, { clean : true, rawData : true }))

  formatOutput({
    basicTitle : 'Roles Report',
    data       : roles,
    mdFormatter,
    terminalFormatter,
    textFormatter,
    reporter,
    req,
    res,
    ...org.roles.constructor.itemConfig,
    ...req.vars
  })
}

export {
  func,
  method,
  parameters,
  path
}
