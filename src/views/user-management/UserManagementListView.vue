<script setup>
/**
 * Halaman Manajemen Pengguna.
 * Ganti dummyData dengan data asli dari userManagement.service.js begitu backend siap.
 *
 * Catatan alur (sesuai kebutuhan produk):
 * - Tombol "Add New" -> diarahkan ke halaman Kelola Admin (RBAC) untuk
 *   super admin mengatur peran & hak akses, BUKAN form tambah user biasa.
 * - Icon pensil (edit) di tiap baris -> diarahkan ke halaman yang sama
 *   (Kelola Admin), bukan form edit user terpisah.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

// Dummy data -- hapus setelah integrasi API
const users = ref([
  {
    id: 1,
    name: 'User Name',
    role: 'Super Admin',
    department: 'Sekretaris Desa',
    accessLevel: 'Full Access',
    status: 'Active',
  },
  {
    id: 2,
    name: 'User Name',
    role: 'Kaur Berita',
    department: 'Administrasi Umum',
    accessLevel: 'Berita Access only',
    status: 'Deactive',
  },
  {
    id: 3,
    name: 'User Name',
    role: 'Kaur Perpustakaan',
    department: 'Pelayanan',
    accessLevel: 'Perpustakaan Access only',
    status: 'Deactive',
  },
  {
    id: 4,
    name: 'User Name',
    role: 'Kaur Gallery',
    department: 'Pelayanan',
    accessLevel: 'Gallery Access only',
    status: 'Deactive',
  },
  {
    id: 5,
    name: 'User Name',
    role: 'Kaur Potensi Desa',
    department: 'Administrasi Umum',
    accessLevel: 'Potensi Desa Access only',
    status: 'Deactive',
  },
  {
    id: 6,
    name: 'User Name',
    role: 'Kaur Agenda',
    department: 'Administrasi',
    accessLevel: 'Agenda Access only',
    status: 'Active',
  },
])

// --- Search ---
const searchQuery = ref('')

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

const filteredUsers = computed(() => {
  let result = [...users.value]

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.department.toLowerCase().includes(query),
    )
  }

  if (sortField.value) {
    result.sort((a, b) => {
      const valA = String(a[sortField.value]).toLowerCase()
      const valB = String(b[sortField.value]).toLowerCase()
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
    selectedIds.value = value ? filteredUsers.value.map((u) => u.id) : []
  },
})

// --- Status badge ---
const statusColor = {
  Active: 'success',
  Deactive: 'secondary',
}

// --- Navigasi ---
function goToAddNew() {
  // Add New -> halaman Kelola Admin (super admin atur peran & hak akses)
  router.push({ name: 'admin-role-management' })
}

function goToEdit(user) {
  // Edit (pensil) -> halaman Kelola Admin juga, sekalian bawa konteks role user ini
  router.push({ name: 'admin-role-management', query: { role: user.role } })
}

function handleDelete(user) {
  confirm.require({
    message: `Hapus pengguna "${user.name}" dengan peran "${user.role}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      // TODO: panggil userManagement.service.js -> deleteUser(user.id)
      users.value = users.value.filter((u) => u.id !== user.id)
      toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
    },
  })
}
</script>

<template>
  <div>
    <div class="card p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 class="page-title mb-0">Manajemen Pengguna</h1>

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
          <tr class="text-left border-b border-neutral-100">
            <th class="py-3 w-10">
              <Checkbox v-model="allSelected" :binary="true" />
            </th>
            <th class="py-3 font-semibold text-neutral-700 cursor-pointer" @click="toggleSort('name')">
              Name <i class="pi pi-sort-alt text-xs text-neutral-400"></i>
            </th>
            <th class="py-3 font-semibold text-neutral-700 cursor-pointer" @click="toggleSort('role')">
              Role / Posisi <i class="pi pi-sort-alt text-xs text-neutral-400"></i>
            </th>
            <th class="py-3 font-semibold text-neutral-700 cursor-pointer" @click="toggleSort('department')">
              Departmen <i class="pi pi-sort-alt text-xs text-neutral-400"></i>
            </th>
            <th class="py-3 font-semibold text-neutral-700 cursor-pointer" @click="toggleSort('accessLevel')">
              Hak Akses <i class="pi pi-sort-alt text-xs text-neutral-400"></i>
            </th>
            <th class="py-3 font-semibold text-neutral-700 cursor-pointer" @click="toggleSort('status')">
              Status <i class="pi pi-sort-alt text-xs text-neutral-400"></i>
            </th>
            <th class="py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="user in filteredUsers"
            :key="user.id"
            class="border-b border-neutral-50"
          >
            <td class="py-3">
              <Checkbox v-model="selectedIds" :value="user.id" />
            </td>
            <td class="py-3">
              <div class="flex items-center gap-2">
                <div class="avatar-placeholder"></div>
                <span class="font-medium text-neutral-800">{{ user.name }}</span>
              </div>
            </td>
            <td class="py-3 text-primary-600 font-medium">{{ user.role }}</td>
            <td class="py-3 text-neutral-600">{{ user.department }}</td>
            <td class="py-3 text-neutral-600">{{ user.accessLevel }}</td>
            <td class="py-3">
              <Tag :value="user.status" :severity="statusColor[user.status]" />
            </td>
            <td class="py-3">
              <div class="flex items-center justify-end gap-2">
                <button class="icon-btn" title="Edit" @click="goToEdit(user)">
                  <i class="pi pi-pencil"></i>
                </button>
                <button class="icon-btn icon-btn-danger" title="Hapus" @click="handleDelete(user)">
                  <i class="pi pi-trash"></i>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="py-8 text-center text-neutral-400">
              Tidak ada pengguna yang cocok dengan pencarian.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-neutral-200, #e5e7eb);
  flex-shrink: 0;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--color-neutral-200, #e5e7eb);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-600, #4b5563);
  background: white;
}
.icon-btn:hover {
  background: var(--color-neutral-50, #f9fafb);
}
.icon-btn-danger:hover {
  color: var(--color-danger-600, #dc2626);
  border-color: var(--color-danger-200, #fecaca);
}
</style>