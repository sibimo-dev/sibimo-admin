export default [
  {
    path: 'survey',
    name: 'survey-results',
    component: () => import('@/views/survey/SurveyResultListView.vue'),
    meta: { breadcrumb: ['Data Kalurahan', 'Hasil Survei'] },
  },
]