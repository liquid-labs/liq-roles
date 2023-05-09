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
    this.serviceBundleNames = []
    this.serviceBundlesToOrdering = {}
    this.verifyAndIndexData()
  }
  
  /**
  * - Ensures the access roles are valid.
  * - Sorts the serviceBundles and caches their alpha ordered position in 'serviceBundlesToOrdering'.
  * - Collects 'serviceBundleNames' of the service bundles actually referenced in the access rules.
  */
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
        if (!(serviceBundle in this.serviceBundlesToOrdering)) {
          this.serviceBundlesToOrdering[serviceBundle] = true // real index is set below after sorting this.serviceBundleNames.length
          this.serviceBundleNames.push(serviceBundle)
        }
      }
      
      this.directRulesByRole[role] = { access , policy }
    } // for this.accessRules loop
    
    // now, we sort the serviceBundles
    this.serviceBundleNames.sort((a,b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    this.serviceBundleNames.forEach((d,i) => {
      this.serviceBundlesToOrdering[d] = i
    })
    
    if (errors.length > 0) {
      throw new Error('There were errors loading the access rules: ' + errors.join(' '))
    }
  }
  
  getDomainOrdering(serviceBundle) {
    return this.serviceBundlesToOrdering[serviceBundle]
  }
  
  // TODO: could be static, except then not visible from instance; could append, or just leave.
  accessRulesToSummaries(row, { excludeRoleCount=false, includeSource=false }) {
    return row.map((e, i) => { // each row, which is a collection
      // 0 is always the role name, so we keep it
      if (i === 0) return e
      // 1 might be the staff count
      if (i === 1 && excludeRoleCount !== true) return e
      // and any value that's null just stays
      else if (e === null) {
        return ''
      }
      else { // we have an array of access rules that we're going to collapse into the effective set.
        return e.sort(({ type: aType }, { type: bType }) => { // notice we are caching the rank
          const aRank = rankAccessType(aType)
          const bRank = rankAccessType(bType)
          return aRank === bRank ? 0 : aRank > bRank ? 1 : -1
        })
        .filter(({ type }, i, array) => {
          if (i === array.length - 1) {
            return true
          }
          // else, let's see if the current rule is subsumed by the later rule
          const nextType = array[i + 1].type
          if (type === nextType) {
            return false // if it's duped, then we can drop it
          }
          else if (type === 'reader') {
            switch (nextType) {
              case 'reader':
              case 'editor':
              case 'admin':
                return false
              default:
                return true
            }
          }
          else if (type === 'editor') {
            switch (nextType) {
              case 'editor':
              case 'admin':
                return false
              default:
                return true
            }
          }
        })
        .map(({ type, source }) => {
          return `${type}${includeSource ? ` (${source})` : ''}`
        }).join('; ')
      }
    }) // row.map
  } // accessRulesToSummaries
} // class RoleAccessLib

const initializeRolesAccess = (org) => {
  if (!org.rolesAccess || !(org.rolesAccess instanceof RolesAccessLib)) {
    // TODO: this is a workaround until we load the access model into the orgs model from here as a plugin
    org.rolesAccess = new RolesAccessLib(org)
  }
  return org.rolesAccess
}

const ORDERED_ACCESS_TYPE = [
  'reader',
  'editor',
  'admin',
  'manager',
  'access-manager'
]

const rankAccessType = (type) => {
  const rank = ORDERED_ACCESS_TYPE.indexOf(type)
  if (rank === -1) throw new Error(`Unknown access type: ${type}`)
  return rank
}

export { initializeRolesAccess, rankAccessType, ORDERED_ACCESS_TYPE }
