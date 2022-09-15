/**
* Displays a list of policy documents attached to (required reading for) each role in the org structure.
*/
import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'
import { getDocumentsByRoles, getPoliciesIndexByRole } from '@liquid-labs/liq-roles-lib'

const method = 'post'
const path = '/orgs/:orgKey/roles/policies/reviews-by-roles'
const parameters = [
  {
    name: 'decompose',
    isBoolean: true,
    description: `Decomposes the policy implications for each role by implied role; i.e., the format goes from:
\`\`\`
{ <role>: [list of documetns],...}
\`\`\`
to the decomposed version:
\`\`\`
{ <role>: { <implied role>: [list of documents ] }, ...}, ...
\`\`\`

When decomposed, only direct requirements are shown for each decomposed role.`
  },
  {
    name: 'directPoliciesOnly',
    isBoolean: true,
    description: "Rather than the default behavior of showing all documents attached to the role (directly and through implication), when `directPoliciesOnly` is set true, only the policy requirements directly defined for the role will be displayed. E.g., a 'Lead Engineer' would only show the additional requirements of being a lead and not the requirements inheritted from a base (implied) 'Engineer' role. Note that decomposed roles are always direct only."
  },
  {
    name: 'includeImpliedRoles',
    isBoolean: true,
    description: "When `includeImpliedRoles` is true, then all roles, not just those defined in the org structure, are considered."
  },
  {
    name: 'staffedOnly',
    isBoolean: true,
    description: "If true, then only those roles which are staffed are included in the report."
  }
]

const func = ({ app, model }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) { // getOrgFromKey handles sending error response, if any
    return
  }
  
  const { decompose, directPoliciesOnly, includeImpliedRoles, staffedOnly } = req.body || {}
  
  const rolePoliciesIndex = getPoliciesIndexByRole({ org, res })
  if (rolePoliciesIndex === false) return // error response handled by lib function
  
  const staffListOptions = { rawData: true}
  // TODO: I don't think the string test is necessary anymore
  if (includeImpliedRoles === true || includeImpliedRoles === 'true') {
    staffListOptions.includeIndirect = true
  }
  const roleNames = org.roles.list(staffListOptions).map((r) => r.name)
    
  const policyDocsByRole = {}
  const getStaffOpts = includeImpliedRoles
    ? { impliedRoles : true }
    : {}
  for (const roleName of roleNames) {
    if ((staffedOnly === true || staffedOnly === 'true')
        && org.roles.getStaffInRole(roleName, getStaffOpts).length === 0)
      continue
    
    if (decompose === true || decompose === 'true') {
      const role = org.roles.get(roleName)
      const subMap = {}
      policyDocsByRole[roleName] = subMap
      for (const subRoleName of [roleName, ...role.allImpliedRoleNames]) {
        subMap[subRoleName] = getDocumentsByRoles({ org, res, roleNames: [subRoleName], rolePoliciesIndex })
        if (subMap[subRoleName] === false) return // ran into error already handled by lib funtion
      }
    }
    else {
      let policyRoles
      if (directPoliciesOnly === true || directPoliciesOnly === 'true') {
        policyRoles = [ roleName ]
      }
      else {
        const role = org.roles.get(roleName)
        policyRoles = [ roleName, ...role.allImpliedRoleNames ]
      }
        
      const policyDocs = getDocumentsByRoles({ org, res, roleNames: policyRoles, rolePoliciesIndex })
      if (policyDocsByRole === false) return // ran into error already handled by lib funtion
      
      policyDocsByRole[roleName] = policyDocs
    }
  }
  
  res.json(policyDocsByRole)
}

export {
  func,
  method,
  parameters,
  path
}
