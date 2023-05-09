import * as fs from 'fs'
import * as fsPath from 'path'

import { toKebabCase } from 'js-convert-case'

import { formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = new RegExp('/orgs/([^/#?]+)/roles/((?!list|org-chart(?:-data)?)[^/#?]+)')
const parameters = []

const func = ({ model }) => (req, res) => {
  const orgKey = req.params[0]
  const org = getOrgFromKey({ model, orgKey, params : req.params, res })
  if (org === false) {
    return
  }
  const roleName = req.params[1]

  const role = org.roles.get(roleName)
  if (!role) {
    res.status(404).json({ message : `No such role '${roleName}' found.` })
  }
  else {
    res.json(role)
  }
}

export { func, method, parameters, path }
