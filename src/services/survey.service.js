// NOTE: change this import to match the HTTP client citizen.service.js uses.
import api from '@/services/api'

const unwrap = (response) => response.data?.data ?? response.data

// params: { period: 'all' | '30' | '90' | '365', service_type?: string }
export async function getAdminSurveyResults(params = {}) {
  const response = await api.get('/admin/surveys/results', { params })
  return unwrap(response)
}