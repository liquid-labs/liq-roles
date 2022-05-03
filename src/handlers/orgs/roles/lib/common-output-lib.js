const commonRolesOutputParams = [
  {
    name: 'excludeDesignated',
    required: false,
    isBoolean: true,
    description: "Excludes non-titular, designated roles from the results."
  },
  {
    name: 'includeIndirect',
    required: false,
    isBoolean: true,
    description: "Shows the default \"fundamental\" roles referenced in requirements and base documentation which are not themselves directly part of the company's job titles or roles definitions."
  }
]

export {
  commonRolesOutputParams
}
