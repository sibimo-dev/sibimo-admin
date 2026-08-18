<script setup>

import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'

import { SECTION_MAP, profileContents } from './villageProfileData'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const section = computed(() => SECTION_MAP[route.meta.sectionSlug])

const selected = ref([])
const filters = ref({
  global: { value: null },
})
const rowsPerPage = ref(10)

// Dummy data -- ganti dengan GET /profile-contents?section_id=... via profileContent.service.js
const rows = computed(() =>
  profileContents.value.filter((c) => c.section_id === section.value.section_id),
)

function statusSeverity(status) {
  return status === 'Published' ? 'success' : 'secondary'
}

function goCreate() {
  router.push({ name: `village-profile-${route.meta.sectionSlug}-create` })
}

function goEdit(row) {
  router.push({
    name: `village-profile-${route.meta.sectionSlug}-edit`,
    params: { id: row.profile_content_id },
  })
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
      profileContents.value = profileContents.value.filter(
        (c) => c.profile_content_id !== row.profile_content_id,
      )
      selected.value = selected.value.filter(
        (item) => item.profile_content_id !== row.profile_content_id,
      )
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}

function deleteSelected() {
  if (selected.value.length === 0) return

  const selectedIds = new Set(selected.value.map((item) => item.profile_content_id))

  confirm.require({
    message: `Hapus ${selected.value.length} item terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      profileContents.value = profileContents.value.filter(
        (c) => !selectedIds.has(c.profile_content_id),
      )
      selected.value = []
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      {{ section.label }}
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola konten {{ section.label.toLowerCase() }} desa.
    </p>

    <Card>
      <template #content>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="m-0 text-base font-semibold text-slate-900">
              {{ section.label }}
            </h2>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <Button
                label="Tambah"
                icon="pi pi-plus"
                @click="goCreate"
              />

              <Button
                label="Hapus"
                icon="pi pi-trash"
                severity="secondary"
                outlined
                :disabled="selected.length === 0"
                @click="deleteSelected"
              />
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <IconField>
                <InputIcon class="pi pi-search" />

                <InputText
                  v-model="filters.global.value"
                  placeholder="Cari judul"
                />
              </IconField>
            </div>
          </div>

          <DataTable
            v-model:selection="selected"
            v-model:filters="filters"
            :value="rows"
            dataKey="profile_content_id"
            :paginator="true"
            :rows="rowsPerPage"
            :rowsPerPageOptions="[10, 25, 50]"
            :globalFilterFields="['title', 'status']"
            sortField="published_at"
            :sortOrder="-1"
            removableSort
            stripedRows
            currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} data"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            class="w-full"
          >
            <template #empty>
              <div class="py-8 text-center text-slate-400">
                Belum ada konten {{ section.label.toLowerCase() }}.
              </div>
            </template>

            <Column selectionMode="multiple" headerStyle="width: 3rem" />

            <Column
              field="title"
              header="Judul"
              sortable
              class="min-w-64"
            />

            <Column
              field="status"
              header="Status"
              sortable
            >
              <template #body="{ data }">
                <Tag
                  :value="data.status"
                  :severity="statusSeverity(data.status)"
                  rounded
                />
              </template>
            </Column>

            <Column
              field="published_at"
              header="Tanggal Terbit"
              sortable
            >
              <template #body="{ data }">
                {{ data.published_at || '-' }}
              </template>
            </Column>

            <Column
              header="Aksi"
              headerStyle="width: 7rem"
            >
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button
                    icon="pi pi-pencil"
                    text
                    rounded
                    severity="secondary"
                    aria-label="Edit"
                    title="Edit"
                    @click="goEdit(data)"
                  />

                  <Button
                    icon="pi pi-trash"
                    text
                    rounded
                    severity="danger"
                    aria-label="Hapus"
                    title="Hapus"
                    @click="handleDelete(data)"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>
    </Card>
  </div>
</template>