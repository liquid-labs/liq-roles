/**
* Generate an "access matrix" report. By default, the X-axis is a list of serviceBundles and the Y-axis is a list of
* company roles.
*/
import { commonOutputParams } from '@liquid-labs/liq-handlers-lib'

import { createAccessMatrix } from '../../_lib/create-access-matrix'
import { commonRolesOutputParams } from '../lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'roles', 'accesses', 'matrix']
const parameters = [...commonOutputParams()]
parameters.push(...commonRolesOutputParams)
parameters.push({
  name        : 'includeSource',
  required    : false,
  isBoolean   : true,
  description : 'If true, then will indicate the role directly granting access, where applicable.'
})
parameters.push({
  name        : 'excludeRoleCount',
  required    : false,
  isBoolean   : true,
  description : 'If true, then will supppress inclusion of a second column giving the count of staff in the named role.'
})
parameters.push({
  name        : 'hideServices',
  required    : false,
  isBoolean   : true,
  description : 'If true, then will supppress inclusion of a sub-header row listing the actual services implied by each  domain bundle.'
})

const func = ({ model, reporter }) => (req, res) => {
  const { allRoles = false, excludeDesignated = false, excludeRoleCount = false, includeIndirect = false } = req.vars
  const subjectsGenerator = ({ org }) =>
    org.roles.list({ sortFunc : sortRoleByAccessAndAlpha, allRoles, excludeDesignated, includeIndirect })
  const subjectSummaryGenerator = excludeRoleCount === true
    ? undefined
    : ({ org, subject }) => org.roles.getStaffInRole(subject.name).length
  const accessTest = (role, baseRole) => role.impliesRole(baseRole)
  const rowLabelGenerator = ({ org, subject: role }) => `=HYPERLINK("${org.innerState.settings.s.policies.POLICY_WEB_ROOT}/staff/Company%20Jobs%20and%20Roles%20Reference.md#${headerRef(role.name)}", "${role.name}")`

  createAccessMatrix({
    accessTest,
    model,
    req,
    res,
    rowLabelGenerator,
    subjectsGenerator,
    subjectHeader        : 'Title/role',
    subjectSummaryHeader : 'Staff #',
    subjectSummaryGenerator
  })
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
