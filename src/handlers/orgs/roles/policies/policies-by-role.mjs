import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'
import { getDocumentsByRoles, getPoliciesIndexByRole } from '@liquid-labs/liq-roles-lib'

const method = 'post'
const path = '/orgs/:orgKey/roles/policies/reviews-by-roles'
const parameters = []

const func = ({ app, model }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) { // getOrgFromKey handles sending error response, if any
    return
  }
  
  const rolePoliciesIndex = getPoliciesIndexByRole({ org, res })
  if (rolePoliciesIndex === false) return // error response handled by lib function
  
  const roleNames = org.roles.list({ rawData: true }).map((r) => r.name)
    
  const policyDocsByRole = {}
  for (const roleName of roleNames) {
    const policyDocs = getDocumentsByRoles({ org, roleNames: [roleName], rolePoliciesIndex })
    if (policyDocsByRole === false) return // ran into error already handled by lib funtion
    policyDocsByRole[roleName] = policyDocs
  }
  
  res.json(policyDocsByRole)
}

export {
  func,
  method,
  parameters,
  path
}
