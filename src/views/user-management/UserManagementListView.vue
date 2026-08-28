<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { createUser, deleteUser, getRoles, getUsers, updateUser } from '@/services/rbac.service'
import { getListCache, setListCache, updateListCache } from '@/services/list-cache'

const route = useRoute()
const confirm = useConfirm()
const toast = useToast()

const cachedUsers = getListCache('users')
const cachedRoles = getListCache('roles')
const users = ref((cachedUsers ?? []).map(mapUser))
const roles = ref(cachedRoles ?? [])
const loading = ref(!cachedUsers && !cachedRoles)
const dialogVisible = ref(false)
const editingUserId = ref(null)
const saving = ref(false)
const form = reactive({
  full_name: '',
  username: '',
  email: '',
  password: '',
  role_id: null,
  phone_number: '',
  is_active: true,
})

function mapUser(user) {
  const roleName = user.role?.name ?? '-'
  return {
    ...user,
    id: user.user_id,
    userName: user.full_name ?? user.username ?? '-',
    positionTitle: roleName,
    department: '-',
    accessLabel: roleName === '-' ? 'No Access' : roleName,
    status: user.is_active ? 'active' : 'inactive',
    isProtected: roleName.toLowerCase() === 'superadmin',
  }
}

async function loadData({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const [userData, roleData] = await Promise.all([getUsers(), getRoles()])
    users.value = (Array.isArray(userData) ? userData : []).map(mapUser)
    roles.value = roleData
    setListCache('users', userData)
    setListCache('roles', roleData)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat pengguna',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    if (!background) loading.value = false
  }
}

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
  if (!query) return users.value

  return users.value.filter(
    (r) =>
      r.userName.toLowerCase().includes(query) ||
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
  updateUser(role.id, { is_active: role.status !== 'active' })
    .then((updated) => {
      const isActive = updated?.is_active ?? role.status !== 'active'
      role.status = isActive ? 'active' : 'inactive'
      updateListCache('users', (items) => items.map((item) => item.user_id === role.id
        ? { ...item, ...updated }
        : item))
    })
    .catch((error) => toast.add({
      severity: 'error',
      summary: 'Gagal mengubah status',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    }))
}

// --- Navigasi ---
function goToAddNew() {
  editingUserId.value = null
  Object.assign(form, {
    full_name: '',
    username: '',
    email: '',
    password: '',
    role_id: roles.value[0]?.role_id ?? null,
    phone_number: '',
    is_active: true,
  })
  dialogVisible.value = true
}

function goToEdit(user) {
  editingUserId.value = user.id
  Object.assign(form, {
    full_name: user.full_name ?? '',
    username: user.username ?? '',
    email: user.email ?? '',
    password: '',
    role_id: user.role_id ?? null,
    phone_number: user.phone_number ?? '',
    is_active: user.is_active,
  })
  dialogVisible.value = true
}

async function saveUser() {
  if (!form.full_name || !form.username || !form.email || !form.role_id) {
    toast.add({ severity: 'warn', summary: 'Data pengguna belum lengkap', life: 2500 })
    return
  }

  saving.value = true
  try {
    const payload = { ...form }
    if (!payload.password) delete payload.password
    const saved = editingUserId.value
      ? await updateUser(editingUserId.value, payload)
      : await createUser(payload)
    updateListCache('users', (items) => editingUserId.value
      ? items.map((item) => item.user_id === editingUserId.value ? { ...item, ...saved } : item)
      : [saved, ...items])
    users.value = editingUserId.value
      ? users.value.map((item) => item.id === editingUserId.value ? mapUser({ ...item, ...saved }) : item)
      : [mapUser(saved), ...users.value]
    dialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Pengguna berhasil disimpan', life: 2500 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan pengguna',
      detail: error.response?.data?.message ?? 'Periksa data dan koneksi backend.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
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
      deleteUser(role.id)
        .then(async () => {
          users.value = users.value.filter((item) => item.id !== role.id)
          updateListCache('users', (items) => items.filter((item) => item.user_id !== role.id))
          toast.add({ severity: 'success', summary: 'Berhasil dihapus', life: 2000 })
        })
        .catch((error) => toast.add({
          severity: 'error',
          summary: 'Gagal menghapus pengguna',
          detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
          life: 4000,
        }))
    },
  })
}

onMounted(() => loadData({ background: Boolean(cachedUsers || cachedRoles) }))
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
        :loading="loading"
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

    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="editingUserId ? 'Edit Pengguna' : 'Tambah Pengguna'"
      :style="{ width: '34rem', maxWidth: '95vw' }"
    >
      <div class="flex flex-col gap-3">
        <InputText v-model="form.full_name" placeholder="Nama lengkap" />
        <InputText v-model="form.username" placeholder="Username" />
        <InputText v-model="form.email" type="email" placeholder="Email" />
        <InputText
          v-model="form.password"
          type="password"
          :placeholder="editingUserId ? 'Password (kosongkan jika tidak diubah)' : 'Password'"
        />
        <InputText v-model="form.phone_number" placeholder="Nomor telepon (opsional)" />
        <Select
          v-model="form.role_id"
          :options="roles"
          option-label="name"
          option-value="role_id"
          placeholder="Pilih role"
          fluid
        />
      </div>

      <template #footer>
        <AppButton label="Batal" variant="outline" @click="dialogVisible = false" />
        <AppButton
          label="Simpan"
          variant="dark"
          :loading="saving"
          @click="saveUser"
        />
      </template>
    </Dialog>
  </div>
</template>
