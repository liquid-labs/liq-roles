/**
* Generate an "access matrix" report. By default, the X-axis is a list of serviceBundles and the Y-axis is a list of
* company roles.
*/
import { commonOutputParams } from '@liquid-labs/liq-handlers-lib'

import { createAccessMatrix } from '../_lib/create-access-matrix'
import { commonRolesOutputParams } from '../roles/lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'staff', 'access-matrix']
const parameters = [...commonOutputParams()]
parameters.push(...commonRolesOutputParams)
parameters.push({
  name        : 'includeSource',
  required    : false,
  isBoolean   : true,
  description : 'If true, then will indicate the role directly granting access, where applicable.'
})
parameters.push({
  name        : 'hideServices',
  required    : false,
  isBoolean   : true,
  description : 'If true, then will supppress inclusion of a sub-header row listing the actual services implied by each  domain bundle.'
})

const func = ({ model, reporter }) => (req, res) => {
  const subjectsGenerator = ({ org }) => org.staff.list({ excludeLogical : true })
  const accessTest = (staff, baseRole) => staff.hasRole(baseRole)
  const rowLabelGenerator = ({ subject: staffMember }) => staffMember.email

  createAccessMatrix({
    accessTest,
    model,
    req,
    res,
    rowLabelGenerator,
    subjectsGenerator,
    subjectHeader : 'Staff email'
  })
}

export { func, parameters, path, method }
