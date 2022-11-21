/**
* #### Developer notes
*
* Attempted to implement a regular server side implementation without the embedded browser nonesense. The examples of
* using d3 on node are thin and it's not clear that d3-org-chart *can* work server side in the first place. After 6+
* hours, hit a problem with a null 'baseVal' on the SVGElement with no clear workaround.
*
* The work was saved in a dead-end branch tagged 'server-side-attempt' with git hash 6097c51 (hash may be incorrect).
*/
import * as fs from 'fs/promises'

import puppeteer from 'puppeteer'

const method = 'get'
const path = '/orgs/:orgKey/roles/org-chart'
const parameters = [
  {
    name: 'interactive',
    description: 'Launches a regular (non-headless) browser.'
  },
  {
    name: 'output',
    description: "Path to save file with our without '.pdf' extension, which will be added if not present. A value of '-' will couse the data to be sent in the result as a PDF attachment."
  }
]

let browserWSEndpoint = undefined

const func = ({ model }) => async (req, res) => {
  const { orgKey } = req.params
  // const org = getOrgFromKey({ model, orgKey, params: req.params, res })
  
  const { interactive = false } = req.query
  const output = !req.query.output
    ? 'org-chart.pdf' // TODO: append timestamp
    : req.query.output.toLowerCase().endsWith('.pdf')
      ? output
      : output + '.pdf'
  
  // yes, we repeat org key, but it makes it easy to retrieve from the HTML page.
  const pageUrl = `http://127.0.0.1:32600/orgs/${orgKey}/roles/org-chart/page`
  
  let browser
  if (browserWSEndpoint === undefined) {
    const options = {
      args: [ '--allow-file-access-from-files' ],
      headless: true
    }
    
    if (interactive === true || interactive === 'true') {
      options.headless = false
    }
    browser = await puppeteer.launch(options)
    browserWSEndpoint = browser.wsEndpoint()
  }
  else {
    browser = await puppeteer.connect({ browserWSEndpoint })
  }
  const page = await browser.newPage()
  page
    .on('console', message =>
      console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('requestfailed', request =>
      console.log(`request to resource '${pageUrl}' failed`))
  
  await page.goto(pageUrl, { waitUntil: 'networkidle0' })
  
  console.log('waiting on ready...') // DEBUG
  try {
    await page.waitForSelector('#ready', { timeout: 5000 })
    console.log('ready!') // DEBUG
  
    const canvas = await page.waitForSelector('canvas')
    console.log('canvas:', canvas) // DEBUG
    
    // const height = canvas.attr('height')
    const [ height, width ] = await page.$eval('canvas', el => [ el.getAttribute('height'), el.getAttribute('width') ])
    // const width = await page.$eval('canvas', el => el.getAttribute('height'))
    
    console.log('height: ' + height, 'width: ' + width) // DEBUG
    
    const pdfBits = await page.pdf({
      'height': height + 'px',
      'width': width + 'px'
    })
    
    if (output === '-') {
      res.setHeader('Content-Length', pdfBits.size)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(`Content-Disposition', 'attachment; filename=${output}`)
      res.send(pdfBits)
    }
    else {
      fs.writeFile(output, pdfBits)
    }
  }
  catch (e) {
    console.error(e)
    throw(e)
  }
  finally {
    console.log("I'm at the end...") // DEBUG
    browser.disconnect()
    if (!interactive) {
      try {
        await browser.close()
      }
      catch (e) {
        console.error('Could not close browser.', e)
        throw(e)
      }
    }
  }
  
  if (!res.headersSent) {
    res.json({ msg: `Created org chart file '${output}'.` })
  }
}

export { func, method, parameters, path }
