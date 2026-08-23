<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useAdminRoles } from '@/composables/useAdminRoles'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const { roles, toggleRoleStatus, removeRole } = useAdminRoles()

// --- Search ---
const searchQuery = ref('')

// Kalau datang dari List Admin lewat tombol "Kelola" (?role=Admin Berita),
// auto-filter tabel ke peran tersebut.
onMounted(() => {
  if (route.query.role) {
    searchQuery.value = String(route.query.role)
  }
})

const filteredUsers = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return roles.value

  return roles.value.filter(
    (r) =>
      r.userName.toLowerCase().includes(query) ||
      r.name.toLowerCase().includes(query) ||
      r.positionTitle.toLowerCase().includes(query) ||
      r.department.toLowerCase().includes(query),
  )
})

// --- Checkbox pilih semua / per baris ---
const selectedIds = ref([])
const allSelected = computed({
  get: () => filteredUsers.value.length > 0 && selectedIds.value.length === filteredUsers.value.length,
  set: (value) => {
    selectedIds.value = value ? filteredUsers.value.map((r) => r.id) : []
  },
})

// --- Status badge ---
const statusColor = {
  active: 'success',
  inactive: 'secondary',
}
const statusLabel = {
  active: 'Active',
  inactive: 'Deactive',
}

// Klik badge status untuk toggle. Super Admin (isProtected) dikunci.
function handleToggleStatus(role) {
  if (role.isProtected) {
    toast.add({
      severity: 'warn',
      summary: 'Super Admin harus selalu aktif',
      life: 2000,
    })
    return
  }
  toggleRoleStatus(role)
}

// --- Navigasi ---
function goToAddNew() {
  // Add New -> halaman Kelola Admin (super admin atur peran & hak akses)
  router.push({ name: 'admin-role-management' })
}

function goToEdit(role) {
  // Edit (pensil) -> halaman Kelola Admin juga, bawa konteks peran RBAC-nya
  router.push({ name: 'admin-role-management', query: { role: role.name } })
}

function handleDelete(role) {
  if (role.isProtected) {
    toast.add({ severity: 'warn', summary: 'Super Admin tidak bisa dihapus', life: 2000 })
    return
  }
  confirm.require({
    message: `Hapus pengguna "${role.userName}" dengan peran "${role.positionTitle}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      // TODO: panggil userManagement.service.js -> deleteUser(role.id)
      removeRole(role.id)
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div>
    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <!-- font judul disamakan ke text-2xl font-bold, konsisten
             dengan h1 di LetterTypeListView.vue -->
        <h1 class="text-2xl font-bold text-gray-800 mb-0">Manajemen Pengguna</h1>

        <div class="flex items-center gap-3">
          <AppInput
            v-model="searchQuery"
            placeholder="Search"
            icon="pi pi-search"
          />
          <AppButton
            label="Add New"
            icon="pi pi-plus"
            variant="dark"
            @click="goToAddNew"
          />
        </div>
      </div>

      <!-- Tabel: DataTable/Column PrimeVue langsung, sorting bawaan per kolom -->
      <DataTable
        :value="filteredUsers"
        data-key="id"
        class="p-datatable-sm"
        responsive-layout="scroll"
      >
        <Column header-style="width: 2.5rem">
          <template #header>
            <Checkbox v-model="allSelected" :binary="true" />
          </template>
          <template #body="{ data }">
            <Checkbox v-model="selectedIds" :value="data.id" />
          </template>
        </Column>

        <Column field="userName" header="Name" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-gray-200 shrink-0"></div>
              <span class="font-medium text-gray-800">{{ data.userName }}</span>
            </div>
          </template>
        </Column>

        <Column field="positionTitle" header="Role / Posisi" sortable>
          <template #body="{ data }">
            <span class="text-blue-600 font-medium">{{ data.positionTitle }}</span>
          </template>
        </Column>

        <Column field="department" header="Departmen" sortable>
          <template #body="{ data }">
            <span class="text-gray-600">{{ data.department }}</span>
          </template>
        </Column>

        <Column field="accessLabel" header="Hak Akses" sortable>
          <template #body="{ data }">
            <span class="text-gray-600">{{ data.accessLabel }}</span>
          </template>
        </Column>

        <Column field="status" header="Status" sortable>
          <template #body="{ data }">
            <button
              class="bg-transparent border-0 p-0 leading-none"
              :class="data.isProtected ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'"
              :title="data.isProtected ? 'Super Admin selalu aktif' : 'Klik untuk mengubah status'"
              @click="handleToggleStatus(data)"
            >
              <Tag :value="statusLabel[data.status]" :severity="statusColor[data.status]" />
            </button>
          </template>
        </Column>

        <Column header-style="width: 5.5rem">
          <template #body="{ data }">
            <div class="flex items-center justify-end gap-2">
              <button
                class="w-8 h-8 rounded-full border border-gray-200 inline-flex items-center justify-center text-gray-600 bg-white hover:bg-gray-50"
                title="Edit"
                @click="goToEdit(data)"
              >
                <i class="pi pi-pencil"></i>
              </button>
              <button
                class="w-8 h-8 rounded-full border border-gray-200 inline-flex items-center justify-center text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 hover:border-red-200"
                title="Hapus"
                @click="handleDelete(data)"
              >
                <i class="pi pi-trash"></i>
              </button>
            </div>
          </template>
        </Column>

        <template #empty>
          <p class="text-center text-gray-400 py-8">
            Tidak ada pengguna yang cocok dengan pencarian.
          </p>
        </template>
      </DataTable>
    </div>
  </div>
</template>