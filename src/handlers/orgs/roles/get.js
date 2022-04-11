import * as fs from 'fs'
import * as fsPath from 'path'

import { toKebabCase } from 'js-convert-case'

import { formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = '/orgs/:orgKey/roles/:roleName([^l].*|l[^i].*|li[^s].*|lis[^t][^/#]?|list[^/#]+)'
// TODO: haven't quite figured out how to make this work
// const path = new RegExp('/orgs/(?<orgKey>[^/#?]+)/roles/(?<roleName>(?!list)')
const parameters = []

const func = ({ model }) => (req, res) => {
  // req.params.orgKey = req.params[0] // DEBUG
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) {
    return
  }
  const { roleName } = req.params
  
  const role = org.roles.get(roleName)
  if (!role) {
    res.status(404).json({ message: `No such role '${roleName}' found.` })
  }
  else {
    res.json(role)
  }
}

export { func, method, parameters, path }
