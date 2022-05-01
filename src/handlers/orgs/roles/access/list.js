import { format as formatCSV } from '@fast-csv/format'
import { toKebabCase } from 'js-convert-case'

import { initializeRolesAccess } from './_lib/roles-access-lib'

const method = 'get'
const path = '/orgs/:orgKey/roles/access(/list)?'

const func = ({ model }) => (req, res) => {
  const { format='json', orgKey, transform } = req.params
  const org = model.orgs[orgKey]
  
  const rolesAccess = initializeRolesAccess(org)
  
  const { errors } = rolesAccess
  if (errors.length > 0) {
    res.status(500).json({ message: errors.length === 1 ? errors[0] : `* ${errors.join("\n* ")}` })
    return
  }
  
  if (transorm !== undefined) {
    return applyTransform({ model, req, res, transformName: transform,  })
  }
  // else, standard data list
  formatOutput( STUFF! )
  
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
}

export { func, path, method }
