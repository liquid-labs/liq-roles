import { toCamelCase, toKebabCase } from 'js-convert-case'

import { commonOutputParams, formatOutput, getOrgFromKey } from '@liquid-labs/liq-handlers-lib'

const method = 'get'
const path = '/orgs/:orgKey/roles/access/serviceBundles(/list)?'
const parameters = commonOutputParams()

const func = ({ model, reporter }) => (req, res) => {
  const org = getOrgFromKey({ model, params: req.params, res })
  if (org === false) {
    return
  }
  
  const data = structuredClone(org.innerState.rolesAccess.serviceBundles)
    .sort((a, b) => a.serviceBundle.toLowerCase().localeCompare(b.serviceBundle.toLowerCase()))
  
  formatOutput({
    basicTitle: 'Service Bundle Report', // <- ignored if 'reportTitle' set
    data,
    dataFlattener,
    /*mdFormatter,*/
    reporter,
    req,
    res,
    ...req.query /* fields, format, output, reportTitle */
  })
}

const dataFlattener = ({ serviceBundle, services }) => ({
  serviceBundle,
  services: services.join(', ')
})
/*
const mdAccessMapper = ({ serviceBundle, type }) => `${type} access to ${serviceBundle}`

const mdFormatter = (accessRules, title) => {
  const markdownBuf = [`# ${title}\n`]
  for (const { role, policy=[], access=[] } of accessRules) {
    markdownBuf.push(
      `## ${role}\n`,
      `Must read policies: ${policy.length === 0 ? '**NONE**': '\n- ' + policy.join('\n- ')}`,
      '\n',
      `Has accesses to: ${access.length === 0 ? '**NOTHING**': '\n- ' + access.map(mdAccessMapper).join('\n- ')}`,
      '\n'
    )
  }
  return markdownBuf.join("\n")
}

const applyTransform = ({ res, transformName, ...transformOptions }) => {
  const camelName = toCamelCase(transformName)
  const transform = transforms[camelName]
  if (transform === undefined) {
    res.status(400)
      .json({ message: `Uknown transform'${transformName}'; try one of: ${Object.keys(transforms).map(t => toKebabCase(t)) }` })
    return
  }
  
  transform({ res, ...transformOptions })
}
*/
export { func, path, method }