import { format as formatTable } from '@fast-csv/format'
import { toCamelCase, toKebabCase, toSentenceCase } from 'js-convert-case'

import { formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from '../roles/accesses/_lib/roles-access-lib'

const createAccessMatrix = ({ 
	accessTest, 
	model, 
	req, 
	res, 
	rowLabelGenerator, 
	subjectsGenerator, 
	subjectHeader, 
	subjectSummaryHeader, 
	subjectSummaryGenerator 
}) => {
	const org = getOrgFromKey({ model, params: req.vars, res })
  if (org === false) return // error response handled by lib

  const {
    hideServices=false,
    includeSource=false,
    ...roleListOptions
  } = req.vars
  let { format='csv' } = req.vars
  
  const rolesAccess = initializeRolesAccess(org)

  if (acceptedFormats[format] === undefined) {
    res.status(400)
      .json({ message: "The 'access-matrix' transform is compatible with table formats (csv, tsv) only." })
    return
  }
  
  if (format === 'tsv') {
    format = 'tab-separated-values'
  }
  
  res.type(`text/${format}`)
  const delimiter = format === 'csv' ? ',' : "\t"
  const tableStream = formatTable({ delimiter })
  tableStream.pipe(res)
  
  const { directRulesByRole, serviceBundleNames } = rolesAccess
  // Staff + optional staff count + each service bundle name
  const headerRow = serviceBundleNames.map(r =>
    `=HYPERLINK("#gid=${org.innerState.settings.s.security.ACCESS_MATRIX_BUNDLES_SHEET_GID}range=A${serviceBundleNames.indexOf(r) + 2}","${r}")`)
  /* originally did the following, but when imported, it wouldn't recognize the hyperlink even though entering the
   formula works
  `=HYPERLINK("#gid=${org.innerState.settings.s.security.ACCESS_MATRIX_BUNDLES_SHEET_GID}range=A"&(MATCH(LOWER("${r}"),ARRAYFORMULA(LOWER('Service bundles'!A2:A)),0)+1),"${r}")`)
  */

  if (subjectSummaryGenerator !== undefined) {
    headerRow.unshift(subjectSummaryHeader)
  }
  headerRow.unshift(subjectHeader)
  tableStream.write(headerRow)

  if (hideServices !== true) {
    const serviceListRow = serviceBundleNames.map(r => {
      const services = rolesAccess.serviceBundles.find(b => b.serviceBundle === r).services
      return services.join(', ')
    })
    serviceListRow.unshift('')
    if (subjectSummaryGenerator !== undefined) serviceListRow.unshift('')
    tableStream.write(serviceListRow)
  } 
  
  const colWidth = headerRow.length
  
  for (const subject of subjectsGenerator({ org, rolesAccess })) {
  	const row = Array.from({length: colWidth}, () => null)

  	row[0] = rowLabelGenerator({ org, subject })
    
    const offset = subjectSummaryGenerator === undefined ? 1 : 2
    
    // Fill in the rest of the row with either 'null' or an array of access rules.
    // e.g. { serviceBundle, type }
    for (const baseRole of Object.keys(directRulesByRole)) {
      if (accessTest(subject, baseRole)) {
        const directAccessRules = directRulesByRole[baseRole]?.access || []
      
        // TODO: we could pre-index the build up across super-roles
        for (const directAccessRule of directAccessRules) {
          directAccessRule.source = baseRole
          const { serviceBundle } = directAccessRule
          const index = rolesAccess.getDomainOrdering(serviceBundle) + offset
          const currCellEntries = row[index] || []
          currCellEntries.push(directAccessRule)
          row[index] = currCellEntries
        }
      }
    }
    
    const summaryRow = rolesAccess.accessRulesToSummaries(row, { excludeRoleCount: true, includeSource })
    tableStream.write(summaryRow)
  } // end role iteration
  tableStream.end()
  res.end()
}

const acceptedFormats = {
  csv: true,
  tsv: true,
  'tab-separated-values': true
}

export { createAccessMatrix }