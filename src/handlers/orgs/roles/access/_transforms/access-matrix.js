import { format as formatTable } from '@fast-csv/format'
import { toSentenceCase } from 'js-convert-case'

const acceptedFormats = {
  csv: true,
  tsv: true,
  'tab-separated-values': true
}

/**
* A transform generating a "access matrix" report. The X-header is a list of domains and the Y-header is a list of
* direct company roles.
*/
const accessMatrix = ({ allRoles=false, excludeRoleCount=false, format='csv', org, res, rolesAccess }) => {
  if (acceptedFormats[format] === undefined) {
    res.status(400).json({ message: "The 'access-matrix' transform is compatible with table formats (csv, tsv) only." })
    return
  }
  
  if (format === 'tsv') {
    format = 'tab-separated-values'
  }
  
  res.type(`text/${format}`)
  const delimiter = format === 'csv' ? ',' : "\t"
  const tableStream = formatTable({ delimiter })
  tableStream.pipe(res)
  
  // This row itself is "just" the header and not referenced later, so it's OK if the domain names differ.
  const domainRow = rolesAccess.domains.map(r => toSentenceCase(r))
  if (excludeRoleCount !== true) {
    domainRow.unshift('Staff #')
  }
  domainRow.unshift('Title/role')
  tableStream.write(domainRow)
  
  const colWidth = domainRow.length
  
  for (const role of org.roles.list({ sortEmploymentStatusFirst: true, includeIndirect: false })) {
    const roleName = role.name
    // If only reporting on 'direct' roles, then let's test if this role gets included or not.
    if (!allRoles &&
        org.staff.getByRoleName(roleName, { ownRole: true, rawData: true }).length == 0) {
      continue
    }
    
    const row = Array.from({length: colWidth}, () => null)
    // the first column is the role name
    row[0] = roleName
    let offset
    // the second is the staff count, unless suppressed
    if (excludeRoleCount !== true) {
      row[1] = org.roles.getStaffInRole(roleName).length
      offset = 2
    }
    else {
      offset = 1
    }
    
    // Fill in the rest of the row with either 'null' or an array of access rules.
    // e.g. { domain, type, scope}
/*    for (let frontierRole = role; frontierRole !== undefined; frontierRole = frontierRole.superRole) {
      const roleName = frontierRole.name*/
    for (const baseRole of Object.keys(rolesAccess.directRulesByRole)) {
      if (role.impliesRole(baseRole)) {
        const directAccessRules = rolesAccess.directRulesByRole[baseRole]?.access || []
      
        // TODO: we could pre-index the build up across super-roles
        for (const directAccessRule of directAccessRules) {
          const { domain } = directAccessRule
          const index = rolesAccess.getIndexForDomain(domain) + offset
          const currCellEntries = row[index] || []
          currCellEntries.push(directAccessRule)
          row[index] = currCellEntries
        }
      }
    }
    
    const summary = rolesAccess.accessRulesToSummaries(row, { excludeRoleCount })
    tableStream.write(summary)
  } // end role iteration
  tableStream.end()
  res.end()
}

export {
  accessMatrix
}
