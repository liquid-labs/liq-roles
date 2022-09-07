import { handlers } from './access'
import * as getRole from './get'
import * as listRoles from './list'
import * as orgChart from './org-chart'
import * as orgChartMeta from './org-chart-meta'

handlers.push(getRole, listRoles, orgChart, orgChartMeta)

export { handlers }
