import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'jobs', 'list']
// excludeDesignated, fields, includeIndirect, noHeaders as of 2022-04-30
const parameters = [...commonOutputParams()]

const pageFormatter = ({ data: jobs, title, h1 = '', h1End = '', h2 = '', h2End = '', em = '', emEnd = '' }) => {
  const lines = []
  if (title !== undefined) {
    lines.push(`${h1}${title}${h1End}\n\n`)
  }
  for (const { title, summary, roles } of jobs) {
    lines.push(
      `${h2}${title}${h2End}\n\n`,
      `${em}Summary${emEnd}\n`,
      summary + '\n\n'
    )

    lines.push(`${em}Roles${emEnd}\n`)
    for (const roleName of roles) {
      lines.push(`- ${roleName}\n`)
    }
    lines.push('\n')
  }
  lines.pop() // last '\n' is unecessary
  return lines.join('')
}

const listFormatter = ({ data: jobs, h1 = '', h1End = '', h2 = '', h2End = '', em = '', emEnd = '' }) => {
  let output = ''
  for (const { title, summary, roles } of jobs) {
    output += `- ${h2}${title}${h2End}: ${summary}`
      + `\n  ${em}Roles:${emEnd} ${roles.join(', ')}\n`
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

  const jobs = org.jobs.list(Object.assign({}, req.vars, { clean : true, rawData : true }))

  formatOutput({
    basicTitle : 'Jobs Report',
    data       : jobs,
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
