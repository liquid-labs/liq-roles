import { format as formatTable } from '@fast-csv/format'

const acceptedFormats = {
  csv: true,
  tsv: true,
  'tab-separated-values': true
}

const accessMatrix = ({ format='csv', org, res, rolesAccess }) => {
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
  
  const domainRow = rolesAccess.domains.slice()
  domainRow.unshift('')
  tableStream.write(domainRow)
  
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
    
    // tableStream.write(rolesAccess.accessRulesToSummaries(row))
    const summary = rolesAccess.accessRulesToSummaries(row)
    tableStream.write(summary)
  } // end role iteration
  tableStream.end()
  res.end()
}

export {
  accessMatrix
}
