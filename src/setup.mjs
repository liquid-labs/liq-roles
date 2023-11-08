import { loadJobs } from './resources/load-jobs'
import { loadRolePlugins } from './handlers/orgs/roles/plugins/_lib/load-role-plugins'
import { loadRoles } from './resources/load-roles'

const setup = async({ app, model, reporter }) => {
  setupPathResolvers({ app, model })

  app.addSetupTask({
    name : 'load role org tasks',
    func : ({ app }) => {
      app.ext._liqOrgs.orgSetupMethods.push({
        name : 'load roles plugins',
        func : loadRolePlugins
      })

      app.ext._liqOrgs.orgSetupMethods.push({
        name : 'load roles',
        deps : ['load roles plugins'],
        func : loadRoles
      })

      app.ext._liqOrgs.orgSetupMethods.push({
        name : 'load jobs',
        deps : ['load roles'],
        func : loadJobs
      })
    }
  })

/* TODO: re-enable this as a policy plugin
  const reportPath = 'security/reports/PCI\\ DSS\\ Roles\\ and\\ Access\\ Report.md'
  for (const [orgKey, org] of Object.entries(model.orgs)) {
    if (!org.policies) {
      org.policies = {}
    }
    if (!org.policies._make) {
      org.policies._make = []
    }

    const buildTargets = [
      '$(OUT_DIR)/' + reportPath
    ]

    const { policyRepoPath } = org

    org.policies._make.push({
      buildTargets,
      rulesDecls : () => `${buildTargets[0]}:
\tmkdir -p $(dir $@)
\tliq2 orgs ${orgKey} roles accesses chd-access > "$@"
\tcat ${policyRepoPath}/src/assets/${reportPath.slice(0, -3)}.append.md >> "$@"
`
    })
  } */
}

const setupPathResolvers = ({ app, model }) => {
  app.ext.pathResolvers.jobTitle = {
    optionsFetcher : ({ currToken = '', orgKey }) => {
      const org = model.orgs[orgKey]
      return org.jobs.list({ rawData : true }).map((r) => r.name.replace(' ', '%20')) || []
    },
    bitReString : '(?:[a-zA-Z_-]|%20)+'
  }

  app.ext.pathResolvers.roleName = {
    optionsFetcher : ({ currToken = '', orgKey }) => {
      const org = model.orgs[orgKey]
      return org.roles.list({ rawData : true }).map((r) => r.name.replace(' ', '%20')) || []
    },
    bitReString : '(?:[a-zA-Z_-]|%20)+'
  }

  app.ext.pathResolvers.rolePluginName = {
    bitReString    : '[a-z][a-z0-9-]*',
    optionsFetcher : ({ model, orgKey }) => {
      const org = model.orgs[orgKey]
      const plugins = org.rolePlugins || []

      return plugins.map(({ name }) => name)
    }
  }
}

export { setup }
