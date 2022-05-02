import { format as formatCSV } from '@fast-csv/format'
import { toKebabCase } from 'js-convert-case'

import { commonOutputParams, formatOutput, getOrgFromKey, paramSorter } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from './_lib/roles-access-lib'
import { commonRolesOutputParams } from '../lib'

const method = 'get'
const path = '/orgs/:orgKey/roles/access(/list)?'
const parameters = commonOutputParams()
parameters.push(...commonRolesOutputParams)

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) {
    return
  }
  
  const rolesAccess = initializeRolesAccess(org)
  const { errors } = rolesAccess
  if (errors.length > 0) {
    res.status(500).json({ message: errors.length === 1 ? errors[0] : `* ${errors.join("\n* ")}` })
    return
  }
  
  const { transformed, ...rest } = req.query
  
  return transformed === undefined
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
    : applyTransform({ model, req, res, transformName: transform, ...rest })
  
  /*
  switch (format) {
    case 'json':
      res.json(rolesAccess.accessRules); break
    case 'csv':
      res.type('text/csv')
      const csvStream = formatCSV()
      csvStream.pipe(res)
      
      const domainRow = rolesAccess.domains.slice()
      domainRow.unshift('')
      csvStream.write(domainRow)
      
      const colWidth = domainRow.length
      
      for (const role of org.roles.list()) {
        const row = Array.from({length: colWidth}, () => null)
        row[0] = role.name
      
        // Fill in the rest of the row with either 'null' or an array of access rules.
        // e.g. { domain, type, scope}
        for (let frontierRole = role; frontierRole !== undefined; frontierRole = frontierRole.superRole) {
          const roleName = frontierRole.name
          const directAccessRules = rolesAccess.directRulesByRole[roleName]?.access || []
          
          // TODO: we could pre-index the build up across super-roles
          for (const directAccessRule of directAccessRules) {
            const { domain } = directAccessRule
            const index = rolesAccess.getIndexForDomain(domain) + 1
            const currCellEntries = row[index] || []
            currCellEntries.push(directAccessRule)
            row[index] = currCellEntries
          }
        }
        
        // csvStream.write(rolesAccess.accessRulesToSummaries(row))
        const summary = rolesAccess.accessRulesToSummaries(row)
        csvStream.write(summary)
      } // end role iteration
      csvStream.end()
      res.end()
      break
    case 'md':
    // TODO: to do MD right, we should 'denormalize' the JSON (rather than the rows) so we can use in CSV and here.
      res.type('text/markdown; charset=UTF-8; variant=GFM')
      res.send(`# Special Access by Role

## Purpose and scope

This document specifies which roles are granted special access to sensitive, controlled resources.

## Reference

* ${Object.keys(rolesAccess.accessRules).sort().map((roleName) => `[${roleName}](#${toKebabCase(roleName)})`).join("* \n")}

${Object.keys(rolesAccess.accessRules).map((roleName) => `### ${roleName}

NOT YET IMPLEMENTED
`)}`)
      break
    default:
      res.status(400).json({ message: `Unsupported format '${format}'.` })
  }
  */
}

const dataFlattener = ({ role, policy=[], access=[] }) => ({
  role,
  policy: policy.join(';'),
  access: access.map(({ domain, type, scope }) => `${domain}/${scope}/${type}`)
})

const mdAccessMapper = ({ domain, type, scope }) => `${scope} ${type} access to ${domain}`

const mdFormatter = (roles, title) => {
  const markdownBuf = [`# ${title}\n`]
  for (const { role, policy=[], access=[] } of roles) {
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

export { func, path, method }
