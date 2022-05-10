const chdRoleSets = [
  {
    roles: [ 'DevOps Engineer', 'Production Administrator' ],
    summary: 'Inclusive of Network, Host, and Cloud Services Engineers'
  },
  /* { roles: [ 'Network Engineer', 'Production Administrator' ] },
  { roles: [ 'Host Engineer', 'Production Administrator' ] },
  { roles: [ 'Cloud Engineer', 'Production Administrator' ] }, */
  { roles: [ 'Database Engineer', 'Production Administrator' ] },
  { roles: [ 'Customer Service Agent' ] }
]

const chdAccess = ({
  allRoles=false,
  excludeRoleCount=false,
  format='md',
  includeSource=false,
  org,
  res,
  rolesAccess
}) => {
  let report = '# Cardholder Data Access Report\n\n'
  for (const { summary, roles } of chdRoleSets) {
    report += `## ${roles[0]}s\n${summary ? `__${summary}__\n` : ''}\n`
    const staff = org.staff.getByRoleName(roles)
    if (!staff || staff.length === 0) {
      report += '__NONE__\n\n'
    }
    else {
      for (const staffMember of staff) {
        report += `- ${staffMember.getFullName()} <${staffMember.email}>\n`
      }
      report += '\n'
    }
  }
  
  res.type(`text/markdown`).send(report)
  /*
List of users who have access to Card holder data environment
And sub-lists
- List of network administrators (by Network Engineer, Senior + Production Administrator)
- List of server administrators (by Host Engineer, Senior + Production Administrator)
- List of database administrators (by Database Engineer, Senior + Production Administrator)
- List of cloud administrators (by Cloud Engineer, Senior + Production Administrator)
- List of application support team (by Customer Support Agent)
- Deploy Managers

- List of application administrators (by Application Admin) <- from Vendors
- List of operation team have access to CDE (by Production Ops <- implied by Visa Support Administrator) <- from Vendors
*/
}

export {
  chdAccess
}
