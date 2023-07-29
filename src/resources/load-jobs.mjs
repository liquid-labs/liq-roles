import * as fs from 'node:fs/promises'
import * as fsPath from 'node:path'

import yaml from 'js-yaml'

import { LIQ_PLAYGROUND } from '@liquid-labs/liq-defaults'

import { Jobs } from './Jobs'

const loadJobs = async({ org }) => {
  const items = []
  const staffRepo = org.requireSetting('org.STAFF_REPO')
  const [ staffOrg, staffProj ] = staffRepo.split('/')
  const jobsDataDir = fsPath.join(LIQ_PLAYGROUND(), staffOrg, staffProj, 'data', 'orgs')
  const jobsYamlPath = fsPath.join(jobsDataDir, 'jobs.yaml')
  let jobsData
  try {
    jobsData = yaml.load(await fs.readFile(jobsYamlPath))
  }
  catch (e) {
    if (e.code === 'ENOENT') {
      const jobsJSONPath = fsPath.join(jobsDataDir, 'jobs.json')
      jobsData = yaml.load(await fs.readFile(jobsJSONPath))
    }
  }

  const jobs = new Jobs({ items: jobsData, org })
  org.bindRootItemManager(jobs)
}

export { loadJobs }
