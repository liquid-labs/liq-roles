import * as fs from 'fs/promises'

import puppeteer from 'puppeteer'

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
  // const org = getOrgFromKey({ model, orgKey, params: req.params, res })
  
  const { interactive = false } = req.query
  
  // yes, we repeat org key, but it makes it easy to retrieve from the HTML page.
  const pageUrl = `http://127.0.0.1:32600/orgs/${orgKey}/roles/org-chart/page?${orgKey}`
  
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
}

export { func, method, parameters, path }
