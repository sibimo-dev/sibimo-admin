import HistoryFormView from '@/views/village-profile/HistoryFormView.vue'
import VisionMissionFormView from '@/views/village-profile/VisionMissionFormView.vue'
import OrganizationalStructureFormView from '@/views/village-profile/OrganizationalStructureFormView.vue'
import RegionDataView from '@/views/village-profile/RegionDataView.vue'


export default [
  {
    path: 'village-profile/history',
    name: 'village-profile-history',
    component: HistoryFormView,
    meta: { breadcrumb: ['Profil Desa', 'Sejarah'] },
  },
  {
    path: 'village-profile/vision-mission',
    name: 'village-profile-vision-mission',
    component: VisionMissionFormView,
    meta: { breadcrumb: ['Profil Desa', 'Visi & Misi'] },
  },
  {
    path: 'village-profile/organizational-structure',
    name: 'village-profile-organizational-structure',
    component: OrganizationalStructureFormView,
    meta: { breadcrumb: ['Profil Desa', 'Struktur Organisasi'] },
  },
  {
    path: 'village-profile/region',
    name: 'village-profile-region',
    component: RegionDataView,
    meta: { breadcrumb: ['Profil Desa', 'Data Wilayah'] },
  },
]
