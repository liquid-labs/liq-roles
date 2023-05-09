import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'roles', ':roleName', 'detail']
// new RegExp('/orgs/([^/#?]+)/roles/((?!list|org-chart(?:-data)?)[^/#?]+)')
const parameters = []

const func = ({ model }) => (req, res) => {
  const { orgKey, roleName } = req.vars
  const org = getOrgFromKey({ model, orgKey, params : req.vars, res })
  if (org === false) {
    return
  }

  const role = org.roles.get(roleName)
  if (!role) {
    res.status(404).json({ message : `No such role '${roleName}' found.` })
  }
  else {
    res.json(role)
  }
}

export { func, method, parameters, path }
