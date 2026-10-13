import api from './api'

export const getDashboardSummary = (period = 'this_month') =>
  api
    .get('/dashboard/summary', { params: { period } })
    .then((response) => response.data.data)
