/* global afterAll beforeAll describe expect jest test */
import * as fsPath from 'path'

import request from 'supertest'

import { appInit, initModel, Reporter } from '@liquid-labs/liq-core'
import { playgroundSimplePath } from '@liquid-labs/liq-test-lib'
import { tryExec } from '@liquid-labs/shell-toolkit'

const playgroundPluginPath = tryExec('npm explore @liquid-labs/liq-playground -- pwd').stdout.trim()

const orgsPluginPath = tryExec('npm explore @liquid-labs/liq-orgs -- pwd').stdout.trim()

const pkgRoot = fsPath.resolve(__dirname, '..', '..', '..', '..', '..')

const logs = []
const testOptions = {
  skipCorePlugins     : true,
  LIQ_PLAYGROUND_PATH : playgroundSimplePath,
  reporter            : new Reporter({ silent : true })
}

testOptions.reporter.log = jest.fn((msg) => { logs.push(msg) })
testOptions.reporter.error = testOptions.reporter.log
testOptions.logs = logs

const staffDataPath = fsPath.join(playgroundSimplePath, 'orgA', 'projectA01', 'staff.json')

describe('GET:/orgs/:orgKey/jobs/XXX/detail', () => {
  let app, cache, model

  beforeAll(async() => {
    process.env.LIQ_PLAYGROUND = playgroundSimplePath
    process.env.LIQ_STAFF_PATH = staffDataPath
    model = initModel(testOptions);
    ({ app, cache } = await appInit(Object.assign(
      { model },
      testOptions,
      { pluginDirs : [playgroundPluginPath, orgsPluginPath, pkgRoot], noAPIUpdate : true }
    )))
  })

  afterAll(async() => { // put the original staff.json back in place
    cache.release()
  })

  test('lists roles as JSON', async() => {
    const { body, headers, status } = await request(app)
      .get('/orgs/orgA/jobs/CTO/detail')
      .accept('application/json')

    expect(status).toBe(200)
    expect(headers['content-type']).toMatch(/application\/json/)
    expect(body.title).toBe('CTO')
    expect(body.roles).toEqual(['Executive Officer', 'Technical'])
    expect(body.managingRoles).toEqual(['CTO'])
  })
})
