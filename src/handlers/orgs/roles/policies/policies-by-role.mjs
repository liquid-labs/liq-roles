import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'
import { getDocumentsByRoles, getPoliciesIndexByRole } from '@liquid-labs/liq-roles-lib'

const method = 'post'
const path = '/orgs/:orgKey/roles/policies/reviews-by-roles'
const parameters = [
  {
    name: 'directOnly',
    isBoolean: true,
    description: `Creates a map of direct policy implications; i.e., drops the implied roles layer. Notice that in this case, the output has format:
\`\`\`
{ <role>: [list of documetns],...}
\`\`\`
rather than standard:
\`\`\`
{ <role>: { <implied role>: [list of documents ] }, ...}, ...
\`\`\`
`
  }
]

const func = ({ app, model }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) { // getOrgFromKey handles sending error response, if any
    return
  }
  
  const { directOnly } = req.query
  
  const rolePoliciesIndex = getPoliciesIndexByRole({ org, res })
  if (rolePoliciesIndex === false) return // error response handled by lib function
  
  const roleNames = org.roles.list({ rawData: true }).map((r) => r.name)
    
  const policyDocsByRole = {}
  for (const roleName of roleNames) {
    if (directOnly === true || directOnly === 'true') {
      const policyDocs = getDocumentsByRoles({ org, res, roleNames: [roleName], rolePoliciesIndex })
      if (policyDocsByRole === false) return // ran into error already handled by lib funtion
      policyDocsByRole[roleName] = policyDocs
    }
    else { // we break down the actual source of the docs
      const role = org.roles.get(roleName)
      const subMap = {}
      policyDocsByRole[roleName] = subMap
      for (const subRoleName of [roleName, ...role.allImpliedRoleNames]) {
        subMap[subRoleName] = getDocumentsByRoles({ org, res, roleNames: [subRoleName], rolePoliciesIndex })
        if (subMap[subRoleName] === false) return // ran into error already handled by lib funtion
      }
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
