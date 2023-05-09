import * as fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = '/orgs/:orgKey/roles/org-chart/:resource'
const parameters = [
  {
    name        : 'resource',
    description : "The meta-data to be retrieved. May be either 'page', 'data', or a known resource required by the page."
  }
]

const myDir = dirname(fileURLToPath(import.meta.url))

// resources referenced by the page
const resourceMap = {
  'd3-org-chart.js'  : myDir + '/../node_modules/d3-org-chart/build/d3-org-chart.js',
  'd3-svg-to-png.js' : myDir + '/../node_modules/d3-svg-to-png/index.js'
}

const func = ({ model }) => async(req, res) => {
  const { orgKey, resource } = req.params // what kind of thing are we looking for?

  if (resource === 'page') { // the base HTML page
    const pagePath = myDir + '/canvas.html'

    const contents = await fs.readFile(pagePath)
    res.type('text/html')
      .send(contents)
  }
  else if (resource === 'data') { // the company org chart model
    const org = getOrgFromKey({ model, orgKey, res })
    if (org === false) { // 'getOrgFromKey' generates the error response
      return
    }
    const staff = org.staff.list()
    const data = []
    for (const staffMember of staff) {
      const rootRoles = []
      for (const role of staffMember.getOwnRoles()) {
        const roleName = role.name
        if (roleName === 'Staff' || roleName === 'Contractor' || roleName === 'Employee') continue

        if (rootRoles.length === 0) {
          rootRoles.push(role)
        }
        if (role.designated) {
          const rootDatum = data.find((d) => d.email === staffMember.email && d.title === rootRoles[0].name)
          rootDatum.secondaryRoles.push(roleName)
          continue
        }
        let handled = false
        // The collapse logic could be more robust
        for (const rootRole of rootRoles) {
          if (rootRole.name !== roleName && rootRole.impliesRole(roleName) || role.manager === staffMember.email) {
            const rootDatum = data.find((d) => d.email === staffMember.email && d.title === rootRole.name)
            rootDatum.secondaryRoles.push(roleName)
            handled = true
            break
          }
        }
        if (handled === false) {
          rootRoles.push(role)
          const datum = {
            id             : staffMember.email + '/' + role.name,
            email          : staffMember.email,
            name           : `${staffMember.givenName} ${staffMember.familyName} <${staffMember.email}>`,
            title          : role.name,
            secondaryRoles : []
          }
          if (role.managerEmail) {
            datum.parentId = role.managerEmail + '/' + role.managerRole
          }

          data.push(datum)
        }
      }
    }
    /*
    for (const staffMember of staff) {
      for (const roles of staffMember.getOwnRoles())
        const sibblingsRoleNamesToMerge =
          role.implies && role.implies.filter((impliedRole) =>
            impliedRle.display !== false
              && impliedRole.mngrProtocol
          )

          role.implies && role.implies.filter(impSpec =>
            impSpec.display !== false
            && impSpec.mngrProtocol === 'same'
              && node.ids.indexOf(`${node.email}/${impSpec.mergeWith}`) >= 0)
            .map(i => i.name)
    } */

    res.type('application/json')
      .send(data)
  }
  else if (resourceMap[resource]) { // javascript resources loaded on the page
    const scriptPath = resourceMap[resource]
    const contents = await fs.readFile(scriptPath)
    // Note all required resource are JS files
    res.type('text/javascript')
      .send(contents)
  }
  else {
    const testFile = myDir + '/' + resource
    try {
      await fs.access(testFile) // raises exception if no file or can't otherwise access
      const contents = await fs.readFile(testFile)
      const type = testFile.endsWith('.map')
        ? 'application/json'
        : 'text/javascript'
      res.type(type)
        .send(contents)
    }
    catch (e) {
      console.error(e)
      res.status(400).json({ message : `Unknown meta data request resource '${resource}'.` })
    }
  }
}

export { func, method, parameters, path }
