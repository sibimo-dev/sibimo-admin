/**
 * Route module untuk Profil Desa (village-profile). Mengikuti tabel
 * `profile_sections` + `profile_contents` di ERD backend.
 *
 * Sejarah, Visi & Misi, dan Struktur Organisasi SEMUA memakai 2 komponen
 * yang sama (VillageProfileListView.vue, VillageProfileFormView.vue) --
 * yang membedakan cuma `meta.sectionSlug`. Ini supaya tidak perlu bikin
 * 6 file nyaris identik untuk 3 section yang skemanya sama persis.
 */
import VillageProfileListView from '@/views/village-profile/VillageProfileListView.vue'
import VillageProfileFormView from '@/views/village-profile/VillageProfileFormView.vue'

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
  ]
}

export default [
  ...buildSectionRoutes('history', 'Sejarah'),
  ...buildSectionRoutes('vision-mission', 'Visi & Misi'),
  ...buildSectionRoutes('organizational-structure', 'Struktur Organisasi'),
]
