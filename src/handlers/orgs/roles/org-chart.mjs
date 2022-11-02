import * as fs from 'fs/promises'

// import * as d3 from 'd3'
import D3Node from 'd3-node'
import { OrgChart } from 'd3-org-chart'
import canvasModule from 'canvas'
// import { JSDOM, VirtualConsole } from 'jsdom'
// import puppeteer from 'puppeteer'

import { getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = '/orgs/:orgKey/roles/org-chart'
const parameters = [
  {
    name: "interactive",
    description: "Launches a regular (non-headless) browser."
  }
]

let browser = undefined

const func = ({ model }) => async (req, res) => {
  const { orgKey } = req.params
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) { // I think 'getOrgFromKey' generates the error
    return
  }
  
  const staff = org.staff.list()
  const data = []
  for (const staffMember of staff) {
    for (const role of staffMember.getOwnRoles()) {
      if (role.designated) continue
      const roleName = role.name
      if (roleName === 'Staff' || roleName === 'Contractor' || roleName === 'Employee') continue
      
      const datum = {
        id : staffMember.email + '/' + role.name,
        email: staffMember.email,
        name: `${staffMember.givenName} ${staffMember.familyName} <${staffMember.email}>`,
        title: role.name
      }
      if (role.managerEmail) {
        datum.parentId = role.managerEmail + '/' + role.managerRole
      }
      
      data.push(datum)
    }
  }
  
  const d3n = new D3Node({ canvasModule })      // initializes D3 with container element
  // console.log(d3)
  const svg = d3n.createSVG(10,20).append('g')
  // OrgChart expects to find these
  global.window = d3n.window
  global.document = d3n.document
  global.navigator = {
    maxTouchPoints: null
  }
  
  global.d3 = d3n.d3 // TODO: necessary?
  // console.log(d3n)
  console.log(d3n.html())
  /*
  const virtualConsole = new VirtualConsole();
  virtualConsole.sendTo(console)
  const dom = new JSDOM('<!DOCTYPE html><body><p id="main"></body>)', { pretendToBeVisual: true, virtualConsole })
  const window = dom.window
  // global.window = window
  global.document = window.document
  
  var vis = d3.select(window.document).select('body').html('').append('svg')
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    .attr('width', 800)// width + pad.l + pad.r)
    .attr('height', 600)// height + pad.t + pad.b)
    .append('g')
  
  // const container = d3.select(window.document).select("svg g")
  console.log(vis)
  // console.log(container)
  */
  const container = d3n.d3.select('svg').element
  console.log(container)
  var chart = new OrgChart()//new OrgChart()
    .container('svg')
    .data(data)
    .render()

  console.log(await chart.exportImg())
  
  // const org = getOrgFromKey({ model, orgKey, params: req.params, res })
  
  /*
  const { interactive = false } = req.query
  
  // yes, we repeat org key, but it makes it easy to retrieve from the HTML page.
  const pageUrl = `http://127.0.0.1:32600/orgs/${orgKey}/roles/org-chart/page`
  
  if (browser === undefined) {
    const options = {
      args: [ '--allow-file-access-from-files' ],
      headless: true
    }
    
    if (interactive === true || interactive === 'true') {
      options.headless = false
    }
    browser = await puppeteer.launch(options)
  }
  const page = await browser.newPage()
  page
    .on('console', message =>
      console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('requestfailed', request =>
      console.log(`request to resource '${pageUrl}' failed`))
  
  await page.goto(pageUrl, { waitUntil: 'networkidle0' })
  
  try {
    await page.waitForSelector('#ready', { timeout: 5000 })
  }
  catch (e) {
    console.error(e)
    // oh well
  }
  
  const pdfBits = await page.pdf()
  
  fs.writeFile('testytest.pdf', pdfBits)
  
  res.send(await page.content())
  
  if (!interactive) browser.close()
  */
}

export { func, method, parameters, path }
