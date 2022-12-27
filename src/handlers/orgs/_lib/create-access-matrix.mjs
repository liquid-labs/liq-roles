import { format as formatTable } from '@fast-csv/format'
import { toCamelCase, toKebabCase, toSentenceCase } from 'js-convert-case'

import { formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from '../roles/accesses/_lib/roles-access-lib'

const createAccessMatrix = ({ accessTest, model, req, res, rowLabelGenerator, subjectsGenerator, subjectHeader }) => {
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

  headerRow.unshift(subjectHeader)
  tableStream.write(headerRow)

  if (hideServices !== true) {
    const serviceListRow = serviceBundleNames.map(r => {
      const services = rolesAccess.serviceBundles.find(b => b.serviceBundle === r).services
      return services.join(', ')
    })
    serviceListRow.unshift('')
    tableStream.write(serviceListRow)
  } 
  
  const colWidth = headerRow.length
  
  for (const subject of subjectsGenerator({ org, rolesAccess })) {
  	const row = Array.from({length: colWidth}, () => null)

  	row[0] = rowLabelGenerator(subject)
    
    const offset = 1
    
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

// TODO: copied from liq-policy/src/liq-gen-roles-ref/lib/helpers.js
const headerRef = (roleName) => roleName.toLowerCase().replace(/[^\w -]*/g, '').replace(/ /g, '-')

const sortRoleByAccessAndAlpha = (a, b) => {
  const aHasAccess = Object.keys(a.getAccess()).length > 0
  const bHasAccess = Object.keys(b.getAccess()).length > 0
  
  if (aHasAccess === bHasAccess) {
    return a.name.localeCompare(b.name)
  }
  else if (aHasAccess) {
    return -1
  }
  else {
    return 1
  }
}

export { createAccessMatrix }