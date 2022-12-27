import { handlers as accessHandlers } from './accesses'
import { handlers as policiesHandlers } from './policies'
import * as getRole from './get'
import * as listRoles from './list'
import * as orgChart from './org-chart'
import * as orgChartMeta from './org-chart-meta'

const handlers = accessHandlers.concat(policiesHandlers)
handlers.push(getRole, listRoles, orgChart, orgChartMeta)

export { handlers }
