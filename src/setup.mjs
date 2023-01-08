const reportPath = 'security/reports/PCI\\ DSS\\ Roles\\ and\\ Access\\ Report.md'

const setup = ({ model, reporter }) => {
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
    
    const { policyDataRepoPath, policyRepoPath } = org
    
    org.policies._make.push({
      buildTargets,
      rulesDecls : () => `${buildTargets[0]}:
\tmkdir -p $(dir $@)
\tliq2 orgs ${orgKey} roles accesses chd-access > "$@"
\tcat ${policyRepoPath}/src/assets/${reportPath.slice(0,-3)}.append.md >> "$@"
`
    })
  }
}

export { setup }
