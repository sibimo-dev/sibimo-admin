
import VillageProfileListView from '@/views/village-profile/VillageProfileListView.vue'
import VillageProfileFormView from '@/views/village-profile/VillageProfileFormView.vue'
import RegionDataView from '@/views/village-profile/RegionDataView.vue'

function buildSectionRoutes(slug, breadcrumbLabel) {
  return [
    {
      path: `village-profile/${slug}`,
      name: `village-profile-${slug}-list`,
      component: VillageProfileListView,
      meta: { sectionSlug: slug, breadcrumb: ['Profil Desa', breadcrumbLabel] },
    },
    {
      path: `village-profile/${slug}/create`,
      name: `village-profile-${slug}-create`,
      component: VillageProfileFormView,
      meta: { sectionSlug: slug, breadcrumb: ['Profil Desa', breadcrumbLabel, 'Tambah'] },
    },
    {
      path: `village-profile/${slug}/:id/edit`,
      name: `village-profile-${slug}-edit`,
      component: VillageProfileFormView,
      meta: { sectionSlug: slug, breadcrumb: ['Profil Desa', breadcrumbLabel, 'Edit'] },
    },
    {
    path: 'village-profile/region',
    name: 'village-profile-region',
    component: RegionDataView,
    meta: { breadcrumb: ['Profil Desa', 'Data Wilayah'] },
    }
  ]
}

export default [
  ...buildSectionRoutes('history', 'Sejarah'),
  ...buildSectionRoutes('vision-mission', 'Visi & Misi'),
  ...buildSectionRoutes('organizational-structure', 'Struktur Organisasi'),
  
]
