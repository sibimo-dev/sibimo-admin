<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import AppButton from '@/components/common/AppButton.vue'
import {
  createRole,
  getPermissions,
  getRoles,
  syncRolePermissions,
} from '@/services/rbac.service'
import { getListCache, setListCache } from '@/services/list-cache'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const modules = [
  { key: 'villageProfile', label: 'Profil Kalurahan', slug: 'profil-kalurahan' },
  { key: 'agenda', label: 'Kelola Agenda', slug: 'agenda' },
  { key: 'news', label: 'Berita & Pengumuman', slug: 'berita' },
  { key: 'library', label: 'Kelola Perpustakaan', slug: 'perpustakaan' },
  { key: 'letterService', label: 'Kelola Layanan', slug: 'surat' },
  { key: 'villagePotential', label: 'Kelola Potensi Kalurahan', slug: 'potensi-kalurahan' },
  { key: 'gallery', label: 'Kelola Gallery', slug: 'gallery' },
  { key: 'userManagement', label: 'Manajemen Admin', slug: 'user-management' },
]
const permissionKeys = ['view', 'create', 'edit', 'delete']
const permissionLabels = { view: 'LIHAT', create: 'BUAT', edit: 'EDIT', delete: 'HAPUS' }
const cachedRoles = getListCache('roles')
const cachedPermissions = getListCache('permissions')
const roles = ref([])
const permissions = ref(cachedPermissions ?? [])
const activeRoleId = ref(null)
const saving = ref(false)
const loading = ref(!cachedRoles && !cachedPermissions)

const emptyModulePermissions = () => Object.fromEntries(
  modules.map((module) => [module.key, {
    view: false,
    create: false,
    edit: false,
    delete: false,
  }]),
)

function mapRole(role) {
  const permissionIds = (role.permissions ?? []).map((permission) => permission.permission_id)
  const selectedSlugs = new Set((role.permissions ?? []).map((permission) => permission.slug))
  const matrix = emptyModulePermissions()

  modules.forEach((module) => {
    if (selectedSlugs.has(module.slug)) {
      permissionKeys.forEach((key) => { matrix[module.key][key] = true })
    }
  })

  return {
    id: role.role_id,
    name: role.name ?? '-',
    description: role.description ?? '',
    status: 'active',
    isProtected: String(role.name ?? '').toLowerCase() === 'superadmin',
    permissionIds,
    permissions: matrix,
  }
}

// Map cache setelah seluruh helper di atas selesai diinisialisasi.
// Sebelumnya mapRole dipanggil sebelum emptyModulePermissions tersedia,
// sehingga halaman role crash ketika cache role sudah terisi.
roles.value = (cachedRoles ?? []).map(mapRole)

const activeRole = computed(() => roles.value.find((role) => role.id === activeRoleId.value))

function selectInitialRole() {
  const requestedName = String(route.query.role ?? '').toLowerCase()
  const requestedRole = roles.value.find((role) => String(role.name ?? '').toLowerCase() === requestedName)
  activeRoleId.value = requestedRole?.id ?? roles.value[0]?.id ?? null
}

// Pilih role dari cache saat komponen dibuat agar matrix permission langsung
// terlihat tanpa menunggu request API selesai.
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

function toggleRoleStatus(role) {
  role.status = role.status === 'active' ? 'inactive' : 'active'
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

async function saveChanges() {
  if (!activeRole.value) return

  saving.value = true
  try {
    const selectedIds = modules
      .filter((module) => Object.values(activeRole.value.permissions[module.key]).some(Boolean))
      .map((module) => permissions.value.find((permission) => permission.slug === module.slug)?.permission_id)
      .filter(Boolean)

    const updated = await syncRolePermissions(activeRole.value.id, selectedIds)
    const index = roles.value.findIndex((role) => role.id === activeRole.value.id)
    if (index !== -1) roles.value[index] = mapRole(updated)
    setListCache('roles', roles.value.map((role) => ({
      role_id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissions.value.filter((permission) => role.permissionIds.includes(permission.permission_id)),
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
        <h1 class="text-2xl font-bold text-gray-800 mb-1">List Admin</h1>
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
          <button
            v-for="role in roles"
            :key="role.id"
            class="flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            :class="{
              'bg-gray-100 text-gray-900 font-semibold border-l-[3px] border-gray-800': role.id === activeRoleId,
            }"
            @click="selectRole(role.id)"
          >
            <span class="flex items-center gap-2">
              <span
                v-if="!role.isProtected"
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="role.status === 'active' ? 'bg-green-500' : 'bg-gray-300'"
              ></span>
              {{ role.name }}
            </span>
            <i v-if="role.id === activeRoleId" class="pi pi-chevron-right text-xs"></i>
          </button>
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

            <!-- Toggle status active/inactive -- disembunyikan untuk Super Admin -->
            <div v-if="!activeRole.isProtected" class="flex items-center gap-2 shrink-0">
              <span
                class="text-xs font-semibold"
                :class="activeRole.status === 'active' ? 'text-green-600' : 'text-gray-400'"
              >
                {{ activeRole.status === 'active' ? 'Active' : 'Deactive' }}
              </span>
              <ToggleSwitch
                :model-value="activeRole.status === 'active'"
                @update:model-value="toggleRoleStatus(activeRole)"
              />
            </div>
          </div>

          <!-- Peringatan saat role nonaktif: semua hak akses otomatis terkunci -->
          <div
            v-if="activeRole.status === 'inactive'"
            class="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs text-gray-500"
          >
            <i class="pi pi-lock"></i>
            Peran ini nonaktif. Semua hak akses dikunci dan tidak berlaku sampai diaktifkan kembali.
          </div>

          <table
            class="w-full text-sm"
            :class="{ 'opacity-50 pointer-events-none': activeRole.status === 'inactive' }"
          >
            <thead>
              <tr class="text-left border-b border-gray-100 bg-gray-50">
                <th class="py-3 px-4 font-semibold text-xs text-gray-500">MODUL</th>
                <th
                  v-for="key in permissionKeys"
                  :key="key"
                  class="py-3 px-4 font-semibold text-xs text-gray-500 text-center"
                >
                  {{ permissionLabels[key] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mod in modules" :key="mod.key" class="border-b border-gray-50">
                <td class="py-3 px-4 font-medium text-gray-800">{{ mod.label }}</td>
                <td v-for="key in permissionKeys" :key="key" class="py-3 px-4 text-center">
                  <Checkbox
                    v-model="activeRole.permissions[mod.key][key]"
                    :binary="true"
                    :disabled="activeRole.status === 'inactive'"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
