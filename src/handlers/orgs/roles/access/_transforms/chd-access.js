const title = 'PCI DSS Roles and Access Report'
// TODO: swap these settings into the yaml settings
const staffSections = [
  {
    sectionHeader : 'Full PAN accessors',
    summary: 'The following staff have access to full 16 digits through some mechanism.',
    roles: [
      'Production Administrator',
      'Production Administrator',
      'Customer Service Agent',
      'Settlement Agent',
      'MOCA Administrator'
    ]
  },
  {
    summary: 'Technical staff administering production network, host, database, and cloud services.',
    roles: [ 'Production Administrator' ]
  },
  {
    summary: 'Manage production users and access.',
    roles: [ 'Access Manager' ]
  },
  {
    summary: 'Production Auditors have read-only access to all CDE runtime and adjacent component configurations, logs, and meta-data. Note that barring a bug in the logging or similar, the Auditor should not be able access cardholder data (CHD). I.e., the Production Auditor looks at configurations, logs, and other meta-data but does not (in this role) see actual data or content.',
    roles: [ 'Production Auditor' ]
  },
  {
    summary: 'Staff with administrative access to the MOCA administrative portal.',
    roles: [ 'MOCA Administrator' ]
  },
  {
    summary: 'Support staff who may access customer transaction data, including full PAN, while addressing customer issues.',
    roles: ['Customer Service Agent']
  },
  {
    summary: 'Accounting staff processing raw transaction records from card processors which include full PANs.',
    roles: ['Settlement Agent']
  }
]

// TODO: derive this from updated Technologies Inventory
const commonCdeChdTech = [
  {
    "technology": "Virtucrypt Virtual HSM (for CVV)",
    "functions": ["CVV calculations"],
    "vendor": "Futurex/Virtucrypt"
  },
  {
    "technology": "Visa APIs",
    "functions": ["card management"],
    "vendor": "Visa Inc."
  },
  {
    "technology": "Visa Call Center",
    "functions": ["fraud management", "dispute management"],
    "vendor": "Visa Inc."
  },
  {
    "technology": "Visa gateway",
    "functions": ["card processing"],
    "vendor": "Visa Inc."
  }
]

const chdSharedTech = [
  ...commonCdeChdTech,
  {
    "technology": "Visa Data Manager (VDM)",
    "functions": ["card management"],
    "vendor": "Visa Inc."
  }
]

const cdeConnectedTech = [
  ...commonCdeChdTech,
  {
    "technology": "Amazon Direct Connect",
    "functions": ["physical interconnect"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon EC2",
    "functions": ["cloud VMs"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon EKS	Kubernetes",
    "functions": ["cluster management"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon IAM",
    "functions": ["account management", "access management"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon MSK",
    "functions": ["messaging service (kafka)"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon RDS / Auroa",
    "functions": ["relational DB management"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon S3",
    "functions": ["cloud storage"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon S3 Glacier",
    "functions": ["production backup"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon SNS",
    "functions": ["SMS"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon VPC",
    "functions": ["VPC"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Amazon WAF",
    "functions": ["public firewall"],
    "vendor": "Amazon Web Services, Inc."
  },
  {
    "technology": "Avocent ACS8000",
    "functions": ["terminal server"],
    "vendor": "Vertiv Group Corp."
  },
  {
    "technology": "Cisco ISR4331/K9",
    "functions": ["physical router"],
    "vendor": "Cisco Systems, Inc."
  },
  {
    "technology": "Cisco WS-C2960X-24TS-L",
    "functions": ["physical switch"],
    "vendor": "Cisco Systems, Inc."
  },
  {
    "technology": "CPI APIs",
    "functions": ["FI APIs"],
    "vendor": "CPI Card Group"
  },
  {
    "technology": "Geist 15327Q",
    "functions": ["power distribution unit"],
    "vendor": "Vertiv Group Corp."
  },
  {
    "technology": "Lexis Nexis",
    "functions": ["KYC checks"],
    "vendor": "LexisNexis"
  },
  {
    "technology": "Nginx",
    "functions": ["web server", "app server"],
    "vendor": "F5, Inc."
  },
  {
    "technology": "OpenJDK / Java 11",
    "functions": ["app runtime"],
    "vendor": "Oracle"
  },
  {
    "technology": "sbt",
    "functions": ["build tool"],
    "vendor": "Lightbend"
  },
  {
    "technology": "SendGrid",
    "functions": ["programatic email"],
    "vendor": "SendGrid"
  },
  {
    "technology": "Taegis XDR agent",
    "functions": ["centralized logging", "IDS/IDP", "SEIM", "antimalware", "int vulnerability scan"],
    "vendor": "SecureWorks"
  },
  {
    "technology": "Taegis XDR analysis service",
    "functions": ["centralized logging", "IDS/IDP", "SEIM", "antimalware", "log monitoring and analysis"],
    "vendor": "SecureWorks"
  },
  {
    "technology": "Ubuntu",
    "functions": ["operating system (hosts)"],
    "vendor": "Canonical Ltd."
  }
]

const indexTechByVendor = (techData) =>
  techData.reduce((acc, { technology, functions, vendor }) => {
    if (vendor in acc) {
      acc[vendor].push({ technology, functions })
    }
    else {
      acc[vendor] = [ { technology, functions } ]
    }
    return acc
  }, {})

const generateVendorContent = (techData) => {
  let results = ''
  const vendorIndex = indexTechByVendor(techData)
  
  for (const vendor of Object.keys(vendorIndex).sort()) {
    const technologies = vendorIndex[vendor]
    
    results += `\n- ${vendor} via`
    
    if (technologies.length === 1) {
      const { technology, functions } = technologies[0]
      results += ` ${technology} (for: _${functions.join(', ')}_)`
    }
    else {
      for (const { technology, functions } of technologies) {
        results += `:\n  - ${technology} (for: _${functions.join(', ')}_)`
      }
    }
  }
  
  return results
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
  // TODO: swap content into template
  let report = `# ${title}

## Purpose and scope

This document details which staff members are directly responsible for the proper handling and security of cardholder data and the cardholder data environment (CDE). This is a generated report derived from the current staff settings as of ${new Date().toISOString()}. This report is considered part of and should be understood in the context of the [Security Framework](./Security%20Framework.md). Understanding who has access to cardholder data is both a requirement for PCI DSS compliance and operationally necessary to ensure proper training, audits, reviews, etc.

## Staff
\n`
  for (const { roles, sectionHeader, summary } of staffSections) {
    const header = sectionHeader !== undefined
      ? sectionHeader
      : roles.length === 1
        ? roles[0]
        : throw new Error(`Found section definition with multple roles and section header defined while generating ${title}`)
    report += `### ${header}\n\n${summary + '\n\n'}`
    const staff = org.staff.getByRoleName(roles, { ownRolesOnly: false })
    if (!staff || staff.length === 0) {
      report += '_NONE_\n\n'
    }
    else {
      for (const staffMember of staff) {
        if (staffMember.employmentStatus !== 'logical')
        report += `- ${staffMember.getFullName()} <${staffMember.email}>\n`
      }
      report += '\n'
    }
  }
  
  report += `
## Third-party vendors and partners

### CDE connected and runtime vendors

The following vendors are connected to, polled by, or integrated into the cardholder data environment (CDE).
`
  report += generateVendorContent(cdeConnectedTech)
  
  report += `\n
### Third-parties with CHD Access
`
  report += generateVendorContent(chdSharedTech)
  report += '\n'
  
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
