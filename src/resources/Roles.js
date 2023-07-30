import merge from 'lodash.merge'

import { Evaluator } from '@liquid-labs/condition-eval'
import { ItemManager } from '@liquid-labs/resource-model'

import { Role } from './Role'

const Roles = class extends ItemManager {
  #org
  #dutiesByDomain

  constructor({ org, ...rest }) {
    super(Object.assign(
      // we start with a blank copy so we don't corrupt the 'rest' options object in case the caller hangs onto it for
      // some reason
      {}, rest, { additionalItemCreationOptions : { org } }
    ))

    this.#org = org
    this.checkCondition = checkCondition
  }

  cleanedData() {
    // return this.list({ rawData: true }).map(StaffMember.itemConfig.dataCleaner)
    return this.list({ all : true, rawData : true }).map((s) => {
      return Role.itemConfig.dataCleaner(s)
    })
  }

  get(name, { fuzzy = false, ...options } = {}) {
    const superOptions = fuzzy === true
      // then we need to generate matching options but with required guaranteed false because if there's not an exact
      // match, we'll use the fuzzy matching logic.
      ? Object.assign({}, options, { required : false, org : this.#org })
      : Object.assign({}, options, { org : this.#org })

    let result = super.get(name, superOptions)
    const {
      errMsgGen,
      required = false,
      rawData = false
    } = options

    if (result === undefined && fuzzy === true) {
      // now fuzzy match if desired
      if (result === undefined && fuzzy === true) {
        const matchingRoles = this.list({ rawData : true, all : true }).filter((role) => {
          if (role.matcher !== undefined) {
            try {
              const { antiPattern, pattern } = role.matcher
              const match = name.match(new RegExp(pattern, 'i'))
              if (match) {
                return !(antiPattern && name.match(new RegExp(antiPattern, 'i')))
              }
            }
            catch (e) {
              throw new Error(`Encountered an error while trying to match role name '${name}'.`, { cause : e })
            }
          }
          return false
        })

        if (matchingRoles.length === 1) {
          result = matchingRoles[0]
        }
        else if (matchingRoles.length > 1) {
          throw new Error(`Ambiguous role '${name}' matched to '${matchingRoles.map((r) => r.name).join("', '")}'`)
        }
      }

      if (result === undefined && required === true) {
        throw new Error(errMsgGen?.(name) || `Did not find requried role '${name}'.`)
      }

      if (rawData !== true && result) result = new Role(result, { org : this.#org })

      return result
    }

    return result
  }

  // TODO: the convention here is reversed; in StaffMember.hasRole(), the option is 'ownRolesOnly' which defaults false.
  getStaffInRole(roleName, { impliedRoles = false, excludeLogical = false } = {}) {
    const filters = []
    if (impliedRoles === true) {
      filters.push((s) => s.hasRole(roleName))
    }
    else { // requires 'own' role
      filters.push((s) => s.getOwnRoles().some((r) => r.name === roleName))
    }

    if (excludeLogical === true) {
      filters.push(({ employmentStatus }) => employmentStatus !== 'logical')
    }

    return this.#org.staff.list()
      .filter((s) => {
        for (const f of filters) {
          if (!f(s)) {
            return false
          }
        }
        return true
      })
  }

  /**
  * Options:
  * - `all`: this is the default.
  * - `excludeDesignated`: if true, only include titular roles. Incompatible with `excludeTitular`.
  * - `excludeStaffRoles`: if true, excludes the the global, implicit 'staff' role.
  * - `excludeTitular`: if true, only includes designated roles. Incompatible with `excludeDesignated`.
  */
  list({
    all = false,
    excludeDesignated = false,
    excludeStaffRoles = false,
    excludeTitular = false,
    sortEmploymentStatusFirst = false,
    ...listOptions
  } = {}) {
    if (excludeTitular === true && excludeDesignated === true) {
      throw new Error('Incompatible options; \'excludeTitular\' and \'excludeDesignated\' cannot both be true.')
    }

    if (sortEmploymentStatusFirst === true) {
      listOptions.sortFunc = employmentSorter
    }

    if (all === true
        || (excludeDesignated === false
          && excludeStaffRoles === false
          && excludeTitular === false)) {
      return super.list(listOptions)
    }
    const filters = []

    if (excludeDesignated === true) {
      filters.push(notDesignatedFilter)
    }
    if (excludeStaffRoles === true) {
      filters.push(excludeStaffRolesFilter)
    }
    if (excludeTitular === true) {
      filters.push(designatedFilter)
    }
    // it's included if no one vetos it.
    const filter = (r) => {
      return !filters.some((f, i) => {
        return f(r) === false
      })
    }

    return super.list(listOptions).filter(filter)
  }

  get fullyIndexedGlobalDuties() {
    if (this.#dutiesByDomain === undefined) {
      this.#dutiesByDomain = {}
      const allDomains = this.#org.innerState?.roleDuties?.reduce((domainNames, { domain }) => {
        domainNames.push(domain)
        return domainNames
      }, []) || []

      for (const domain of allDomains) {
        const dutySpec = this.#org.innerState?.roleDuties.find((d) => d.domain === domain)
        if (dutySpec === undefined) {
          throw new Error(`Did not find expected duty domain spec '${domain}' in 'roleDuties'.`)
        }
        const { duties } = dutySpec

        let myDutySpec = this.#dutiesByDomain[domain]
        if (!myDutySpec) {
          myDutySpec = {}
          this.#dutiesByDomain[domain] = myDutySpec
        }
        merge(myDutySpec, duties) // lodash merge mutates the first object
      }
    }

    return structuredClone(this.#dutiesByDomain) // eslint-disable-line no-undef -- defined in node 17.0.0
  }
}

const notDesignatedFilter = (role) => role.designated !== true
const designatedFilter = (role) => role.designated === true

const excludeStaffRolesFilter = (r) => {
  const { name } = r
  return !(name === 'Staff' || name === 'Employee' || name === 'Contractor')
}

const employmentSorter = (a, b) => {
  const aName = a.name
  const bName = b.name
  if (aName === bName) { // I don't think this ever happens, but just in case
    return 0
  }
  if (aName === 'Staff') {
    return -1
  }
  if (bName === 'Staff') {
    return 1
  }
  if (aName === 'Employee') { // we know bName isn't 'Staff'
    return -1
  }
  if (bName === 'Employee') { // we know aName isn't 'Staff'
    return 1
  }
  if (aName === 'Contractor') { // we know bName isn't 'Staff' or 'Employee'
    return -1
  }
  if (bName === 'Contractor') { // we know aName isn't 'Staff' or 'Employee'
    return 1
  }
  else {
    return aName.localeCompare(bName)
  }
}

/**
* Obligitory 'checkCondition' function provided by the API for processing inclusion or exclusion of Roles targets in
* an audit.
*/
const checkCondition = (condition, role) => {
  const parameters = Object.assign(
    {
      SEC_TRIVIAL : 1,
      ALWAYS      : 1,
      NEVER       : 0
    },
    role.parameters)

  // TODO: test if leaving it 'true'/'false' works.
  parameters.DESIGNATED = role.designated ? 1 : 0
  parameters.SINGULAR = role.singular ? 1 : 0

  const zeroRes = []

  const evaluator = new Evaluator({ parameters, zeroRes })
  return evaluator.evalTruth(condition)
}

Object.defineProperty(Roles, 'itemConfig', {
  value        : Role.itemConfig,
  writable     : false,
  enumerable   : true,
  configurable : false
})

export { Roles }
