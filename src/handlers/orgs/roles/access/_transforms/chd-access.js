const sections = {
  'Technical operations': {
    summary: 'These staff memebrs manage and have access to critical systems within and enabling the CDE.',
    roleSets: [
      {
        roles: [ 'Production Administrator' ],
        summary: 'Administer production network, host, database, and cloud services.'
      },
      {
        roles: [ 'Access Manager' ],
        summary: 'Managers production users and access.'
      }
    ]
  },
  'Support and business operations': {
    summary: 'These staff access and process transactions on behalf of the customer or internal business processes.',
    roleSets: [
      {
        roles: [ 'MOCA Administrator' ],
        summary: 'Staff with administrative access to the MOCA administrative portal.'
      },
      {
        roles: ['Customer Service Agent'],
        summary: 'May access customer transaction data, including full PAN, while addressing customer issues.'
      },
      {
        roles: ['Settlement Agent'],
        summary: 'Processes raw transaction records from card processors which include full PANs.'
      }
    ]
  }
}

const chdAccess = ({
  allRoles=false,
  excludeRoleCount=false,
  format='md',
  includeSource=false,
  org,
  res,
  rolesAccess
}) => {
  let report = `# PCI DSS Roles and Access Report

## Purpose and scope

This document details which staff members directly responsible for the proper handling and security of cardholder data and the cardholder data environment (CDE).

`
  for (const section of Object.keys(sections)) {
    const { summary, roleSets } = sections[section]
    report += `## ${section}\n\n${summary}\n\n`

    for (const { summary, roles } of roleSets) {
      report += `### ${roles[0]}s\n${summary ? `__${summary}__\n` : ''}\n`
      const staff = org.staff.getByRoleName(roles, { ownRolesOnly: false })
      if (!staff || staff.length === 0) {
        report += '__NONE__\n\n'
      }
      else {
        for (const staffMember of staff) {
          if (staffMember.employmentStatus !== 'logical')
          report += `- ${staffMember.getFullName()} <${staffMember.email}>\n`
        }
        report += '\n'
      }
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
