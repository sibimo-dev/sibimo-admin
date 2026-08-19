<script setup>
/**
 * Halaman Manajemen Pengguna.
 *
 * Data sekarang berasal dari composable singleton `useAdminRoles` --
 * SUMBER YANG SAMA dipakai oleh AdminRoleManagementView.vue (List Admin).
 * Karena itu, toggle status Active/Deactive di tabel ini langsung
 * kelihatan berubah juga di sidebar List Admin, tanpa reload dan tanpa
 * perlu sinkronisasi manual -- keduanya baca dari ref yang sama persis.
 *
 * Catatan alur (sesuai kebutuhan produk):
 * - Tombol "Add New" -> diarahkan ke halaman Kelola Admin (RBAC) untuk
 *   super admin mengatur peran & hak akses, BUKAN form tambah user biasa.
 * - Icon pensil (edit) di tiap baris -> diarahkan ke halaman yang sama
 *   (Kelola Admin), sekalian bawa konteks peran (RBAC) user ini lewat
 *   query ?role=... (dicocokkan ke `role.name`, bukan `positionTitle`).
 * - Badge Status bisa langsung diklik di sini untuk toggle Active/Deactive.
 * - Kalau halaman ini dibuka dari tombol "Kelola" di List Admin
 *   (?role=Admin Berita, dst), tabel otomatis ke-filter ke peran itu.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
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

// --- Sort ---
const sortField = ref(null)
const sortDirection = ref('asc') // 'asc' | 'desc'

function toggleSort(field) {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

// Field yang dipakai untuk sort per kolom (menyesuaikan nama field di roles)
const sortAccessor = {
  name: (r) => r.userName,
  role: (r) => r.positionTitle,
  department: (r) => r.department,
  accessLevel: (r) => r.accessLabel,
  status: (r) => r.status,
}

const filteredUsers = computed(() => {
  let result = [...roles.value]

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (r) =>
        r.userName.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        r.positionTitle.toLowerCase().includes(query) ||
        r.department.toLowerCase().includes(query),
    )
  }

  if (sortField.value) {
    const accessor = sortAccessor[sortField.value]
    result.sort((a, b) => {
      const valA = String(accessor(a)).toLowerCase()
      const valB = String(accessor(b)).toLowerCase()
      if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
      if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return result
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

      <!-- Tabel -->
      <table class="w-full text-sm">
        <thead>
          <tr class="text-left border-b border-gray-100">
            <th class="py-3 w-10">
              <Checkbox v-model="allSelected" :binary="true" />
            </th>
            <th class="py-3 font-semibold text-gray-700 cursor-pointer" @click="toggleSort('name')">
              Name <i class="pi pi-sort-alt text-xs text-gray-400"></i>
            </th>
            <th class="py-3 font-semibold text-gray-700 cursor-pointer" @click="toggleSort('role')">
              Role / Posisi <i class="pi pi-sort-alt text-xs text-gray-400"></i>
            </th>
            <th class="py-3 font-semibold text-gray-700 cursor-pointer" @click="toggleSort('department')">
              Departmen <i class="pi pi-sort-alt text-xs text-gray-400"></i>
            </th>
            <th class="py-3 font-semibold text-gray-700 cursor-pointer" @click="toggleSort('accessLevel')">
              Hak Akses <i class="pi pi-sort-alt text-xs text-gray-400"></i>
            </th>
            <th class="py-3 font-semibold text-gray-700 cursor-pointer" @click="toggleSort('status')">
              Status <i class="pi pi-sort-alt text-xs text-gray-400"></i>
            </th>
            <th class="py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="role in filteredUsers"
            :key="role.id"
            class="border-b border-gray-50"
          >
            <td class="py-3">
              <Checkbox v-model="selectedIds" :value="role.id" />
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-gray-200 shrink-0"></div>
                <span class="font-medium text-gray-800">{{ role.userName }}</span>
              </div>
            </td>
            <td class="py-3 text-blue-600 font-medium">{{ role.positionTitle }}</td>
            <td class="py-3 text-gray-600">{{ role.department }}</td>
            <td class="py-3 text-gray-600">{{ role.accessLabel }}</td>
            <td class="py-3">
              <button
                class="bg-transparent border-0 p-0 leading-none"
                :class="role.isProtected ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'"
                :title="role.isProtected ? 'Super Admin selalu aktif' : 'Klik untuk mengubah status'"
                @click="handleToggleStatus(role)"
              >
                <Tag :value="statusLabel[role.status]" :severity="statusColor[role.status]" />
              </button>
            </td>
            <td class="py-3">
              <div class="flex items-center justify-end gap-2">
                <button
                  class="w-8 h-8 rounded-full border border-gray-200 inline-flex items-center justify-center text-gray-600 bg-white hover:bg-gray-50"
                  title="Edit"
                  @click="goToEdit(role)"
                >
                  <i class="pi pi-pencil"></i>
                </button>
                <button
                  class="w-8 h-8 rounded-full border border-gray-200 inline-flex items-center justify-center text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 hover:border-red-200"
                  title="Hapus"
                  @click="handleDelete(role)"
                >
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="py-8 text-center text-gray-400">
              Tidak ada pengguna yang cocok dengan pencarian.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>