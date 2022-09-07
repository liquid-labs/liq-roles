import * as fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const method = 'get'
const path = '/orgs/:orgKey/roles/org-chart/:resource'
const parameters = [
  {
    name: 'resource',
    description: "The meta-data to be retrieved. May be either 'page', 'data', or a known resource required by the page.",
  }
]

const myDir = dirname(fileURLToPath(import.meta.url))

// resources referenced by the page
const resourceMap = {
  'd3.v7.js': myDir + '/d3.v7.js',
  'd3-flextree.js':  myDir + '/d3-flextree.js',
  'd3-org-chart.js': myDir + '/../node_modules/d3-org-chart/build/d3-org-chart.js'
}

const func = ({ model }) => async (req, res) => {
  const { resource } = req.params // what kind of thing are we looking for?
  
  if (resource === 'page') { // the base HTML page
    const pagePath = myDir + '/canvas.html'
    
    const contents = await fs.readFile(pagePath)
    res.type('text/html')
      .send(contents)
  }
  else if (resourceMap[resource]) { // javascript resources loaded on the page
    // Note all required resource are JS files
    const scriptPath = resourceMap[resource]
    const contents = await fs.readFile(scriptPath)
    res.type('text/javascript')
      .send(contents)
  }
  else if (resource === 'data') { // the company org chart model
    const data = []
    data.push({
      name: "Ian",
      id: "ian@mocapay.com",
      location: "Bastrop",
      positionName: "CEO",
      parentId: null
    },
    {
      name: "Sarah",
      id: "sarah@mocapay.com",
      location: "India",
      positionName: "CTO",
      parentId: "ian@mocapay.com"
    })
    
    res.type('application/json')
      .send(data)
  }
  else {
    res.status(400).json({ message: `Unknown meta data request resource '${resource}'.` })
  }
}

export { func, method, parameters, path }
