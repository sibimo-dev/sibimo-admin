<script setup>
/**
 * Halaman Kelola Admin (Role-Based Access Control).
 * Ganti dummyData di useAdminRoles.js dengan data asli dari
 * userManagement.service.js begitu backend siap.
 * Diakses dari UserManagementListView.vue lewat tombol "Add New" atau icon pensil.
 *
 * Data roles sekarang berasal dari composable singleton `useAdminRoles`,
 * BUKAN local ref lagi -- supaya perubahan status yang dilakukan di
 * UserManagementListView.vue (Manajemen Pengguna) langsung kelihatan di
 * sini juga, dan sebaliknya, tanpa perlu reload atau lewat query param.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import AppButton from '@/components/common/AppButton.vue'
import { useAdminRoles } from '@/composables/useAdminRoles'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  roles,
  modules,
  permissionKeys,
  permissionLabels,
  findRoleByName,
  toggleRoleStatus,
  addRole,
} = useAdminRoles()

// --- Peran yang sedang dipilih ---
const activeRoleId = ref(roles.value[0].id)
const activeRole = computed(() => roles.value.find((r) => r.id === activeRoleId.value))

// Kalau datang dari UserManagementListView dengan query ?role=..., pilih role yang sesuai
onMounted(() => {
  const roleFromQuery = route.query.role
  if (roleFromQuery) {
    const matched = findRoleByName(roleFromQuery)
    if (matched) activeRoleId.value = matched.id
  }
})

function selectRole(roleId) {
  activeRoleId.value = roleId
}

// --- Tambah peran baru ---
function handleAddRole() {
  const newRole = addRole()
  activeRoleId.value = newRole.id
}

// --- Simpan / Batal ---
const saving = ref(false)

async function saveChanges() {
  saving.value = true
  try {
    // TODO: panggil userManagement.service.js -> updateRolePermissions(activeRole.value)
    // Backend juga wajib validasi ulang: kalau role.status === 'inactive',
    // permission apapun yang tersimpan harus dianggap tidak berlaku.
    console.log('Simpan hak akses untuk peran', activeRole.value)
    toast.add({ severity: 'success', summary: 'Perubahan hak akses disimpan', life: 2000 })

    // Kasih jeda sebentar biar toast sempat kelihatan sebelum pindah halaman
    setTimeout(() => {
      router.push({ name: 'user-management-list' })
    }, 800)
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