import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = ['orgs', ':orgKey', 'jobs', ':jobName', 'detail']

const parameters = []

const func = ({ model }) => (req, res) => {
  const { orgKey, jobName } = req.vars
  const org = getOrgFromKey({ model, orgKey, params : req.vars, res })
  if (org === false) {
    return
  }

  const job = org.jobs.get(jobName)
  if (!job) {
    res.status(404).json({ message : `No such role '${roleName}' found.` })
  }
  else {
    httpSmartResponse({ data: job, req, res })
  }
}

export { func, method, parameters, path }
