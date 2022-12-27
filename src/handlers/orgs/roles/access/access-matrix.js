/**
* Generate an "access matrix" report. By default, the X-axis is a list of serviceBundles and the Y-axis is a list of 
* company roles.
*/
import { format as formatTable } from '@fast-csv/format'
import { toCamelCase, toKebabCase, toSentenceCase } from 'js-convert-case'

import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

import { initializeRolesAccess } from './_lib/roles-access-lib'
import { commonRolesOutputParams } from '../lib'
import { accessMatrix } from './_transforms'

const method = 'get'
const path = [ 'orgs', ':orgKey', 'roles', 'access', 'matrix' ]
const parameters = commonOutputParams()
parameters.push(...commonRolesOutputParams)
parameters.push({
  name: 'includeSource',
  required: false,
  isBoolean: true,
  description: "If true, then will indicate the role directly granting access, where applicable."
})
parameters.push({
  name: 'hideServices',
  required: false,
  isBoolean: true,
  description: "If true, then will supppress inclusion of a sub-header row listing the actual services implied by each  domain bundle."
})

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.vars, res })
  if (org === false) return // error response handled by lib

  const {
    allRoles=false,
    excludeRoleCount=false,
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
  // This row itself is "just" the header and not referenced later, so it's OK if the serviceBundle names differ.
  const serviceBundleRow = serviceBundleNames.map(r =>
    `=HYPERLINK("#gid=${org.innerState.settings.s.security.ACCESS_MATRIX_BUNDLES_SHEET_GID}range=A${serviceBundleNames.indexOf(r) + 2}","${r}")`)
    /* originally did the following, but when imported, it wouldn't recognize the hyperlink even though entering the
       formula works
    `=HYPERLINK("#gid=${org.innerState.settings.s.security.ACCESS_MATRIX_BUNDLES_SHEET_GID}range=A"&(MATCH(LOWER("${r}"),ARRAYFORMULA(LOWER('Service bundles'!A2:A)),0)+1),"${r}")`)
    */
  // =HYPERLINK("#gid=1029216696range=A"&MATCH(LOWER("MOCA Admin Portal"),ARRAYFORMULA(LOWER('Service bundles'!A2:A)),0)+1, "Moca admin portal")
  
  if (excludeRoleCount !== true) {
    serviceBundleRow.unshift('Staff #')
  }
  serviceBundleRow.unshift('Title/role')
  tableStream.write(serviceBundleRow)

  if (hideServices !== true) {
    const serviceListRow = serviceBundleNames.map(r => {
      const services = rolesAccess.serviceBundles.find(b => b.serviceBundle === r).services
      return services.join(', ')
    })
    if (excludeRoleCount !== true) {
      serviceListRow.unshift('')
    }
    serviceListRow.unshift('')
    tableStream.write(serviceListRow)
  } 
  
  const colWidth = serviceBundleRow.length
  
  for (const role of org.roles.list({ sortFunc: sortRoleByAccessAndAlpha, ...roleListOptions })) {
    const roleName = role.name
    // If only reporting on 'direct' roles, then let's test if this role gets included or not.
    if (!allRoles &&
        org.staff.getByRoleName(roleName, { ownRole: true, rawData: true }).length === 0) {
      continue
    }
    
    const row = Array.from({length: colWidth}, () => null)
    // the first column is the role name
    row[0] = `=HYPERLINK("${org.innerState.settings.s.policies.POLICY_WEB_ROOT}/staff/Company%20Jobs%20and%20Roles%20Reference.md#${headerRef(roleName)}", "${roleName}")`
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
    // e.g. { serviceBundle, type }
    for (const baseRole of Object.keys(directRulesByRole)) {
      if (role.impliesRole(baseRole)) {
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
    
    const summaryRow = rolesAccess.accessRulesToSummaries(row, { excludeRoleCount, includeSource })
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

export { func, parameters, path, method }
