/**
* #### Developer notes
*
* Attempted to implement a regular server side implementation without the embedded browser nonesense. The examples of
* using d3 on node are thin and it's not clear that d3-org-chart *can* work server side in the first place. After 6+
* hours, hit a problem with a null 'baseVal' on the SVGElement with no clear workaround.
*
* The work was saved in a dead-end branch tagged 'server-side-attempt' with git hash 6097c51 (hash may be incorrect).
*
* TODO: extract the 'browser' to a 'liq-lib-puppeteer' project or something and make it a generally accessible resource.
*/
import * as fs from 'fs/promises'

import puppeteer from 'puppeteer'

const method = 'get'
const path = [ 'orgs', ':orgKey', 'roles', 'org-chart' ]
const parameters = [
  {
    name: 'interactive',
    description: 'Launches a regular (non-headless) browser.'
  },
  {
    name: 'output',
    description: "Path to save file with our without '.pdf' extension, which will be added if not present. A value of '-' will couse the data to be sent in the result as a PDF attachment."
  },
  {
    name: 'writeFileLocally',
    isBoolean: true,
    description: "If true, then will write 'output' using 'fs' rather than sending as a result in the response."
  }
]

// TODO: the current logic which attempts to cache the browser for future use does not work. We tried with 'browser' also declared here in case the problem was it going out of scope, but that didn't help (or if it did, there are other problems).
/**
* The websocket endpoint for the created browser.
*/
// let browserWSEndpoint = undefined
const browserOptions = {
  args: [ '--allow-file-access-from-files' ],
  headless: true
}

const browserKey = 'liq-roles:browserBundle'

const getBrowser = async ({ cache, interactive }) => {
  let { browser, isInteractive } = cache.get(browserKey) || {}
  
  if (browser !== undefined && (interactive === 'true' || interactive === true) && isInteractive !== true) {
    browser.close()
    browser = undefined
  }
  
  try {
    if (browser === undefined) {
      const options = Object.assign({}, browserOptions)
      
      isInteractive = false
      if (interactive === true || interactive === 'true') {
        options.headless = false
        isInteractive = true
      }
      browser = await puppeteer.launch(options)
      
      cache.put(browserKey, { browser, isInteractive }, { finalizationCallback: () => { browser.close() }})
      
      return browser
    }
    else {
      const browserWSEndpoint = browser.wsEndpoint()
      return await puppeteer.connect({ browserWSEndpoint })
    }
  }
  catch (e) {
    console.error(e)
    throw new Error('Error creating/connecting to browser.', { cause: e })
  }
}

const func = ({ cache, model }) => async (req, res) => {
  const { orgKey } = req.vars
  // const org = getOrgFromKey({ model, orgKey, params: req.params, res })
  
  const { interactive = false, writeFileLocally = false } = req.query
  const output = !req.vars.output
    ? 'org-chart.pdf' // TODO: append timestamp
    : req.query.output.toLowerCase().endsWith('.pdf')
      ? req.vars.output
      : req.vars.output + '.pdf'
  
  // yes, we repeat org key, but it makes it easy to retrieve from the HTML page.
  const pageUrl = `http://127.0.0.1:32600/orgs/${orgKey}/roles/org-chart/page`
  
  const browser = await getBrowser({ cache, interactive })
  
  const page = await browser.newPage()
  page
    .on('console', message =>
      console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
    .on('pageerror', ({ message }) => console.log(message))
    .on('requestfailed', request =>
      console.log(`request to resource '${pageUrl}' failed`))
  
  try {
    await page.goto(pageUrl, { waitUntil: 'networkidle0' })
  
    await page.waitForSelector('#ready', { timeout: 5000 })
  
    const canvas = await page.waitForSelector('canvas')
    
    const [ height, width ] = await page.$eval('canvas', el => [ el.getAttribute('height'), el.getAttribute('width') ])
    
    const pdfBits = await page.pdf({
      'height': height + 'px',
      'width': width + 'px'
    })
    
    if (output === '-') {
      res.setHeader('Content-Type', 'text/plain')
      res.send(pdfBits)
    }
    else if (writeFileLocally !== true && writeFileLocally !== 'true') {
      res.setHeader('Content-Length', pdfBits.length)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=${output}`)
      res.send(pdfBits)
    }
    else {
      fs.writeFile(output, pdfBits)
      res.json({ msg: `Created org chart file '${output}'.` })
    }
  }
  catch (e) {
    console.error(e)
    throw(e)
  }
  finally {
    if (!interactive) {
      await page.close()
    }
    browser.disconnect()
  }
}

export { func, method, parameters, path }
