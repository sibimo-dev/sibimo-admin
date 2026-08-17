<script setup>
/**
 * VillageProfileListView - list generik untuk SEMUA section Profil Desa
 * (Sejarah, Visi & Misi, Struktur Organisasi). Ketiganya berbagi skema
 * yang sama persis (tabel `profile_contents`, di-filter `section_id`),
 * jadi sengaja dibuat 1 komponen reusable -- bukan 3 file terpisah yang
 * isinya hampir identik -- supaya perbaikan/perubahan cukup di 1 tempat.
 *
 * Section mana yang ditampilkan ditentukan dari `route.meta.sectionSlug`,
 * didaftarkan di router/modules/village-profile.routes.js.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import AppDataTable from '@/components/common/AppDataTable.vue'
import AppButton from '@/components/common/AppButton.vue'
import { SECTION_MAP, profileContents } from './villageProfileData'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const section = computed(() => SECTION_MAP[route.meta.sectionSlug])

const columns = [
  { field: 'title', header: 'Judul' },
  { field: 'status', header: 'Status' },
  { field: 'published_at', header: 'Tanggal Terbit' },
]

// Dummy data -- ganti dengan GET /profile-contents?section_id=... via profileContent.service.js
const rows = computed(() =>
  profileContents.value.filter((c) => c.section_id === section.value.section_id),
)

function goCreate() {
  router.push({ name: `village-profile-${route.meta.sectionSlug}-create` })
}

function goEdit(row) {
  router.push({ name: `village-profile-${route.meta.sectionSlug}-edit`, params: { id: row.profile_content_id } })
}

function handleDelete(row) {
  confirm.require({
    message: `Hapus "${row.title}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      profileContents.value = profileContents.value.filter((c) => c.profile_content_id !== row.profile_content_id)
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="page-title">{{ section.label }}</h1>
        <p class="page-subtitle mb-0">Kelola konten {{ section.label.toLowerCase() }} desa</p>
      </div>
      <AppButton label="Tambah" icon="pi pi-plus" variant="primary" @click="goCreate" />
    </div>

    <AppDataTable :columns="columns" :rows="rows" data-key="profile_content_id">
      <template #status="{ data }">
        <Tag :value="data.status" :severity="data.status === 'Published' ? 'success' : 'secondary'" />
      </template>
      <template #published_at="{ data }">
        {{ data.published_at || '-' }}
      </template>
      <template #actions="{ data }">
        <AppButton icon="pi pi-pencil" variant="ghost" size="small" @click="goEdit(data)" />
        <AppButton icon="pi pi-trash" variant="ghost" size="small" @click="handleDelete(data)" />
      </template>
    </AppDataTable>
  </div>
</template>
