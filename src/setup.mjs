const setup = ({ model, reporter }) => {
  for (const [orgKey, org] of Object.entries(model.orgs)) {
    if (!org.policies) {
      org.policies = {}
    }
    if (!org.policies._make) {
      org.policies._make = []
    }
    
    const buildTargets = [ '$(OUT_DIR)/security/PCI\\ DSS\\ Roles\\ and\\ Access\\ Report.md' ]
    
    org.policies._make.push({
      buildTargets,
      rulesDecls : () => `${buildTargets[0]}:\n\tliq orgs ${orgKey} roles access list -- transform=chdAccess > "$@"`
    })
  }
}

export { setup }
