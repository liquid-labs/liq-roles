// TODO: this stuff should be moved into a orgs-model plugin... once that's supported
class RolesAccessLib {
  constructor(org) {
    // initializes:
    // this.accessRules,
    // this.serviceBundles
    Object.assign(this, org.innerState.rolesAccess)
    org.rolesAccess = this
    this.org = org
    
    this.directRulesByRole = {}
    this.serviceBundles = []
    this.serviceBundlesToIndexMap = {}
    this.verifyAndIndexData()
  }
  
  verifyAndIndexData() {
    const errors = []
    // TODO: It's actually more like 'roleRules'
    for (const { role, access = [], policy = [] } of this.accessRules.sort((a, b) => a.role.localeCompare(b.role))) {
      // verify the role is known
      if (this.org.roles.get(role, { rawData: true }) === undefined) {
        errors.push(`No such role '${role}' as referenced from 'access roles'.`)
      }
      
      // track the unique serviceBundles; it's possible the same access is iheritted from multiple sources
      for (const { serviceBundle } of access) {
        if (this.serviceBundlesToIndexMap[serviceBundle] === undefined) {
          this.serviceBundlesToIndexMap[serviceBundle] = true // real index is set below after sorting this.serviceBundles.length
          this.serviceBundles.push(serviceBundle)
        }
      }
      
      this.directRulesByRole[role] = { access , policy }
    } // for this.accessRules loop
    
    // now, we sort the serviceBundles
    this.serviceBundles.sort()
    this.serviceBundles.forEach((d,i) => {
      this.serviceBundlesToIndexMap[d] = i
    })
    
    if (errors.length > 0) {
      throw new Error('There were errors loading the access rules: ' + errors.join(' '))
    }
  }
  
  getIndexForDomain(serviceBundle) {
    return this.serviceBundlesToIndexMap[serviceBundle]
  }
  
  // TODO: could be static, except then not visible from instance; could append, or just leave.
  accessRulesToSummaries(row, { excludeRoleCount=false, includeSource=false }) {
    return row.map((e, i) => { // each row, which is a collection
      if (i === 0) return e
      if (i === 1 && excludeRoleCount !== true) return e
      else if (e === null) {
        return ''
      }
      else {
        e.sort((a, b) => { // notice we are caching the rank
          const aRank = a.rank || accessRank(a)
          a.rank = aRank
          const bRank = b.rank || accessRank(b)
          b.rank = bRank
          return aRank > bRank ? -1 : aRank < bRank ? 1 : 0
        })
        
        let priorRule = null
        e = e.filter((ar) => {
          const { rank, type } = ar
          const priorRank = priorRule?.rank
          const priorType = priorRule?.type
          // updates prior rule and returns true if it can pass the gauntlet
          // always keep the first rule and if the prior rule has a (+) rank and the curr rule (-), it's of a
          // different kind and we keep
          if (priorRule !== null && !(priorRank > 0 && rank < 0)) {
            const priorTypeRank = Math.floor(priorRank / 2) // TODO: why divide by 2?
            const currTypeRank = Math.floor(rank / 2)
            if (priorTypeRank >= currTypeRank) return false
            // otherwise we keep it
          }
          
          priorRule = ar
          return true
        })

        return e.map(({ type, source }) => {
          return `${type}${includeSource ? ` (${source})` : ''}`
        }).join('; ')
      }
    })
  }
}

const accessRank = ({ type }) => {
  let result = 0
  switch (type) {
    case 'reader': result = 2; break
    case 'editor': result = 4; break
    case 'manager': result = 6; break
    case 'admin': result = 8; break
    case 'access-manager': result = -10; break
    default: throw new Error(`Found unknown access type '${type}'`)
  }
  
  return result
}

const initializeRolesAccess = (org) => {
  if (!org.rolesAccess || !(org.rolesAccess instanceof RolesAccessLib)) {
    // TODO: this is a workaround until we load the access model into the orgs model from here as a plugin
    org.rolesAccess = new RolesAccessLib(org)
  }
  return org.rolesAccess
}

export { initializeRolesAccess }
