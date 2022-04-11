import { commonOutputConfig, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = '/orgs/:orgKey/roles(/list)?'
const parameters = [
  {
    name: 'fields',
    required: false,
    isMultivalue: true,
    description: "An array or comma-separated list of field names."
  },
  {
    name: 'noHeaders',
    requried: false,
    isBoolean: true,
    description: "Excludes headers row from flat table outputs if 'false'."
  },
  {
    name: 'includeIndirect',
    required: false,
    isBoolean: true,
    description: "Shows the default \"fundamental\" roles referenced in requirements and base documentation which are not themselves directly part of the company's job titles or roles definitions."
  },
  {
    name: 'excludeDesignated',
    required: false,
    isBoolean: true,
    description: "Excludes non-titular, designated roles from the results."
  }
]
const validParams = parameters.map(p => p.name)
validParams.push('format', 'output')

const mdFormatter = (roles, title) =>
  `# ${title}

## Roles

${roles.map(({name, summary}) => `### ${name}\n\n${summary}\n`).join("\n")}`

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) {
    return
  }
  // const { includeIndirect = false, excludeDesignated = false } = req.query
  
  const roles = org.roles.list(Object.assign({}, req.query, { clean : true, rawData : true }))

  formatOutput({
    basicTitle : 'Roles Report',
    data : roles,
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
