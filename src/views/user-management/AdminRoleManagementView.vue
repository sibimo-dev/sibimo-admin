<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  syncRolePermissions,
  updateRole,
} from '@/services/rbac.service'
import { getListCache, setListCache, updateListCache } from '@/services/list-cache'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()

const cachedRoles = getListCache('roles')
const cachedPermissions = getListCache('permissions')
const roles = ref([])
const permissions = ref(cachedPermissions ?? [])
const activeRoleId = ref(null)
const saving = ref(false)
const loading = ref(!cachedRoles && !cachedPermissions)

// Daftar modul yang ditampilkan di matrix hak akses diambil langsung dari
// table permissions (bukan hardcode di FE lagi). Halaman Dashboard sengaja
// dikeluarkan dari daftar ini -- semua Role bisa akses Dashboard tanpa
// perlu diberi hak akses secara eksplisit.
const assignableModules = computed(() =>
  permissions.value.filter((permission) => String(permission.slug ?? '').toLowerCase() !== 'dashboard'),
)

// Setiap modul sekarang cukup 1 checkbox "Akses" (all access), tidak perlu
// lagi kolom Lihat / Buat / Edit / Hapus terpisah.
function buildAccessMap(role) {
  const grantedIds = new Set((role.permissions ?? []).map((permission) => permission.permission_id))
  return Object.fromEntries(
    permissions.value.map((permission) => [permission.permission_id, grantedIds.has(permission.permission_id)]),
  )
}

function mapRole(role) {
  return {
    id: role.role_id,
    name: role.name ?? '-',
    description: role.description ?? '',
    isProtected: String(role.name ?? '').toLowerCase() === 'superadmin',
    access: buildAccessMap(role),
  }
}

roles.value = (cachedRoles ?? []).map(mapRole)

const activeRole = computed(() => roles.value.find((role) => role.id === activeRoleId.value))

function selectInitialRole() {
  const requestedName = String(route.query.role ?? '').toLowerCase()
  const requestedRole = roles.value.find((role) => String(role.name ?? '').toLowerCase() === requestedName)
  activeRoleId.value = requestedRole?.id ?? roles.value[0]?.id ?? null
}

selectInitialRole()

async function loadData({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const [roleData, permissionData] = await Promise.all([getRoles(), getPermissions()])
    permissions.value = permissionData
    roles.value = roleData.map(mapRole)
    setListCache('roles', roleData)
    setListCache('permissions', permissionData)

    selectInitialRole()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat role',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    if (!background) loading.value = false
  }
}

onMounted(() => loadData({ background: Boolean(cachedRoles || cachedPermissions) }))

function selectRole(roleId) {
  activeRoleId.value = roleId
}

async function handleAddRole() {
  try {
    const created = await createRole({
      name: `Role Baru ${Date.now()}`,
      description: 'Role baru',
    })
    roles.value.push(mapRole({ ...created, permissions: [] }))
    setListCache('roles', [created, ...(getListCache('roles') ?? [])])
    activeRoleId.value = created.role_id
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal membuat role',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  }
}

// --- Edit nama & deskripsi role ---
const editDialogVisible = ref(false)
const editForm = reactive({ name: '', description: '' })
const editSaving = ref(false)

function openEditRole(role) {
  editForm.name = role.name
  editForm.description = role.description
  editDialogVisible.value = true
}

async function saveRoleName() {
  if (!activeRole.value || !editForm.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Nama role tidak boleh kosong', life: 2500 })
    return
  }

  editSaving.value = true
  try {
    const updated = await updateRole(activeRole.value.id, {
      name: editForm.name.trim(),
      description: editForm.description,
    })
    const index = roles.value.findIndex((role) => role.id === activeRole.value.id)
    if (index !== -1) {
      roles.value[index] = { ...roles.value[index], name: updated.name ?? editForm.name, description: updated.description ?? editForm.description }
    }
    updateListCache('roles', (items) => items.map((item) => (item.role_id === activeRole.value.id ? { ...item, ...updated } : item)))
    editDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Role berhasil diperbarui', life: 2000 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memperbarui role',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    editSaving.value = false
  }
}

// --- Hapus role ---
function handleDeleteRole(role) {
  if (role.isProtected) {
    toast.add({ severity: 'warn', summary: 'Super Admin tidak bisa dihapus', life: 2000 })
    return
  }
  confirm.require({
    message: `Hapus role "${role.name}"? Pengguna dengan role ini perlu dipindahkan ke role lain.`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteRole(role.id)
        roles.value = roles.value.filter((item) => item.id !== role.id)
        updateListCache('roles', (items) => items.filter((item) => item.role_id !== role.id))
        if (activeRoleId.value === role.id) {
          activeRoleId.value = roles.value[0]?.id ?? null
        }
        toast.add({ severity: 'success', summary: 'Role berhasil dihapus', life: 2000 })
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Gagal menghapus role',
          detail: error.response?.data?.message ?? 'Role mungkin masih dipakai pengguna lain.',
          life: 4000,
        })
      }
    },
  })
}

async function saveChanges() {
  if (!activeRole.value) return

  saving.value = true
  try {
    const selectedIds = permissions.value
      .filter((permission) => activeRole.value.access[permission.permission_id])
      .map((permission) => permission.permission_id)

    const updated = await syncRolePermissions(activeRole.value.id, selectedIds)
    const index = roles.value.findIndex((role) => role.id === activeRole.value.id)
    if (index !== -1) roles.value[index] = mapRole(updated)
    setListCache('roles', roles.value.map((role) => ({
      role_id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissions.value.filter((permission) => role.access[permission.permission_id]),
    })))

    toast.add({ severity: 'success', summary: 'Perubahan hak akses disimpan', life: 2000 })
    setTimeout(() => router.push({ name: 'user-management-list' }), 800)
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan hak akses',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.push({ name: 'user-management-list' })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 mb-1">Role & Hak Akses</h1>
        <p class="text-sm text-gray-500 mb-0">
          Pengelolaan role-based access control dan hak izin modul.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <AppButton label="Batal" variant="outline" @click="cancel" />
        <AppButton
          label="Simpan Perubahan"
          variant="dark"
          :loading="saving"
          @click="saveChanges"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <!-- Kolom kiri: daftar peran -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-bold tracking-wide text-gray-500">PERAN</span>
          <button
            class="w-6 h-6 rounded-md inline-flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-gray-200"
            title="Tambah peran"
            @click="handleAddRole"
          >
            <i class="pi pi-plus"></i>
          </button>
        </div>

        <div class="flex flex-col">
          <div
            v-for="role in roles"
            :key="role.id"
            class="group flex items-center justify-between rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            :class="{
              'bg-gray-100 text-gray-900 font-semibold': role.id === activeRoleId,
            }"
          >
            <button
              class="flex-1 text-left px-3 py-2.5 bg-transparent border-0"
              :class="{ 'border-l-[3px] border-gray-800': role.id === activeRoleId }"
              @click="selectRole(role.id)"
            >
              {{ role.name }}
            </button>

            <div class="flex items-center gap-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="w-6 h-6 rounded-md inline-flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                title="Edit nama role"
                @click.stop="openEditRole(role)"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button
                v-if="!role.isProtected"
                class="w-6 h-6 rounded-md inline-flex items-center justify-center text-gray-500 hover:bg-red-100 hover:text-red-600"
                title="Hapus role"
                @click.stop="handleDeleteRole(role)"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Kolom kanan: matrix hak akses -->
      <div class="lg:col-span-3">
        <div v-if="activeRole" class="bg-white rounded-2xl border border-gray-200 shadow-sm !p-0 overflow-hidden">
          <div class="flex items-start justify-between px-4 py-4 border-b border-gray-100">
            <div>
              <h2 class="text-xs font-bold tracking-wide text-gray-800 mb-0.5">
                HAK AKSES {{ activeRole.name.toUpperCase() }}
              </h2>
              <p class="text-sm text-gray-500 mb-0">{{ activeRole.description }}</p>
            </div>
          </div>

          <table class="w-full text-sm">
            <thead>
              <tr class="text-left border-b border-gray-100 bg-gray-50">
                <th class="py-3 px-4 font-semibold text-xs text-gray-500">MODUL</th>
                <th class="py-3 px-4 font-semibold text-xs text-gray-500 text-center w-28">AKSES</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="permission in assignableModules" :key="permission.permission_id" class="border-b border-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">{{ permission.name ?? permission.slug }}</td>
                <td class="py-3 px-4 text-center">
                  <Checkbox
                    v-model="activeRole.access[permission.permission_id]"
                    :binary="true"
                  />
                </td>
              </tr>
              <tr v-if="assignableModules.length === 0">
                <td colspan="2" class="py-6 px-4 text-center text-gray-400">
                  Belum ada modul (permission) yang bisa diatur.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Dialog edit nama & deskripsi role -->
    <Dialog
      v-model:visible="editDialogVisible"
      modal
      header="Edit Role"
      :style="{ width: '28rem', maxWidth: '95vw' }"
    >
      <div class="flex flex-col gap-3">
        <AppInput v-model="editForm.name" label="Nama Role" required placeholder="Nama role" />
        <AppInput v-model="editForm.description" label="Deskripsi" placeholder="Deskripsi role (opsional)" />
      </div>

      <template #footer>
        <AppButton label="Batal" variant="outline" @click="editDialogVisible = false" />
        <AppButton
          label="Simpan"
          variant="dark"
          :loading="editSaving"
          @click="saveRoleName"
        />
      </template>
    </Dialog>
  </div>
</template>