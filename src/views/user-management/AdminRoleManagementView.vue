<script setup>
/**
 * Halaman Kelola Admin (Role-Based Access Control).
 * Ganti dummyData dengan data asli dari userManagement.service.js begitu backend siap.
 * Diakses dari UserManagementListView.vue lewat tombol "Add New" atau icon pensil.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import AppButton from '@/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Daftar modul yang bisa diatur hak aksesnya per peran
const modules = [
  { key: 'villageProfile', label: 'Profile Desa' },
  { key: 'agenda', label: 'Kelola Agenda' },
  { key: 'news', label: 'Berita & Pengumuman' },
  { key: 'library', label: 'Kelola Perpustakaan' },
  { key: 'letterService', label: 'Kelola Layanan' },
  { key: 'villagePotential', label: 'Kelola Potensi' },
  { key: 'gallery', label: 'Kelola Gallery' },
  { key: 'userManagement', label: 'Manajemen Admin' },
]

const permissionKeys = ['view', 'create', 'edit', 'delete']
const permissionLabels = { view: 'LIHAT', create: 'BUAT', edit: 'EDIT', delete: 'HAPUS' }

// Helper bikin permission penuh (semua true) atau kosong (semua false)
function fullAccess() {
  return { view: true, create: true, edit: true, delete: true }
}
function noAccess() {
  return { view: false, create: false, edit: false, delete: false }
}
function viewOnly() {
  return { view: true, create: false, edit: false, delete: false }
}

// Dummy data -- hapus setelah integrasi API
// permissions: { [moduleKey]: { view, create, edit, delete } }
const roles = ref([
  {
    id: 'super-admin',
    name: 'Super Admin',
    description: 'Akses Sistem Penuh dan Konfigurasi.',
    status: 'active',
    // Super Admin tidak boleh dinonaktifkan lewat toggle -- selalu active.
    isProtected: true,
    permissions: {
      villageProfile: fullAccess(),
      agenda: fullAccess(),
      news: fullAccess(),
      library: fullAccess(),
      letterService: fullAccess(),
      villagePotential: fullAccess(),
      gallery: fullAccess(),
      // Manajemen Admin: super admin tidak bisa hapus dirinya sendiri/role lain lewat sini
      userManagement: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    id: 'admin-desa',
    name: 'Admin Desa',
    description: 'Mengelola data umum profil dan layanan desa.',
    status: 'active',
    permissions: {
      villageProfile: fullAccess(),
      agenda: viewOnly(),
      news: viewOnly(),
      library: noAccess(),
      letterService: fullAccess(),
      villagePotential: viewOnly(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-agenda',
    name: 'Admin Agenda',
    description: 'Mengelola jadwal dan agenda kegiatan desa.',
    status: 'active',
    permissions: {
      villageProfile: noAccess(),
      agenda: fullAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-berita',
    name: 'Admin Berita',
    description: 'Mengelola berita dan pengumuman desa.',
    status: 'inactive',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: fullAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-perpustakaan',
    name: 'Admin Perpustakaan',
    description: 'Mengelola koleksi dan data perpustakaan desa.',
    status: 'active',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: fullAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-layanan',
    name: 'Admin Layanan',
    description: 'Mengelola pengajuan dan verifikasi surat layanan.',
    status: 'active',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: fullAccess(),
      villagePotential: noAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-potensi',
    name: 'Admin Potensi',
    description: 'Mengelola data potensi dan UMKM desa.',
    status: 'active',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: fullAccess(),
      gallery: noAccess(),
      userManagement: noAccess(),
    },
  },
  {
    id: 'admin-gallery',
    name: 'Admin Gallery',
    description: 'Mengelola galeri foto dan dokumentasi kegiatan.',
    status: 'active',
    permissions: {
      villageProfile: noAccess(),
      agenda: noAccess(),
      news: noAccess(),
      library: noAccess(),
      letterService: noAccess(),
      villagePotential: noAccess(),
      gallery: fullAccess(),
      userManagement: noAccess(),
    },
  },
])

// --- Peran yang sedang dipilih ---
const activeRoleId = ref(roles.value[0].id)
const activeRole = computed(() => roles.value.find((r) => r.id === activeRoleId.value))

// Kalau datang dari UserManagementListView dengan query ?role=..., pilih role yang sesuai
onMounted(() => {
  const roleFromQuery = route.query.role
  if (roleFromQuery) {
    const matched = roles.value.find(
      (r) => r.name.toLowerCase() === String(roleFromQuery).toLowerCase(),
    )
    if (matched) activeRoleId.value = matched.id
  }
})

function selectRole(roleId) {
  activeRoleId.value = roleId
}

// --- Tambah peran baru ---
function addRole() {
  const newRole = {
    id: `role-${Date.now()}`,
    name: 'Peran Baru',
    description: 'Deskripsi peran belum diatur.',
    status: 'active',
    permissions: Object.fromEntries(modules.map((m) => [m.key, noAccess()])),
  }
  roles.value.push(newRole)
  activeRoleId.value = newRole.id
}

// --- Toggle status active/inactive per role ---
// Super Admin (isProtected) tidak boleh dinonaktifkan.
function toggleRoleStatus(role) {
  if (role.isProtected) return
  role.status = role.status === 'active' ? 'inactive' : 'active'
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
        <h1 class="page-title mb-1">List Admin</h1>
        <p class="page-subtitle mb-0">
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
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <span class="role-title">PERAN</span>
          <button class="icon-btn" title="Tambah peran" @click="addRole">
            <i class="pi pi-plus"></i>
          </button>
        </div>

        <div class="flex flex-col">
          <button
            v-for="role in roles"
            :key="role.id"
            class="role-item"
            :class="{ 'role-item-active': role.id === activeRoleId }"
            @click="selectRole(role.id)"
          >
            <span class="flex items-center gap-2">
              <span
                v-if="!role.isProtected"
                class="w-1.5 h-1.5 rounded-full shrink-0"
                :class="role.status === 'active' ? 'bg-success-500' : 'bg-neutral-300'"
              ></span>
              {{ role.name }}
            </span>
            <i v-if="role.id === activeRoleId" class="pi pi-chevron-right text-xs"></i>
          </button>
        </div>
      </div>

      <!-- Kolom kanan: matrix hak akses -->
      <div class="lg:col-span-3">
        <div v-if="activeRole" class="card p-0 overflow-hidden">
          <div class="flex items-start justify-between px-4 py-4 border-b border-neutral-100">
            <div>
              <h2 class="permission-title">HAK AKSES {{ activeRole.name.toUpperCase() }}</h2>
              <p class="text-sm text-neutral-500 mb-0">{{ activeRole.description }}</p>
            </div>

            <!-- Toggle status active/inactive -- disembunyikan untuk Super Admin -->
            <div v-if="!activeRole.isProtected" class="flex items-center gap-2 shrink-0">
              <span
                class="text-xs font-semibold"
                :class="activeRole.status === 'active' ? 'text-success-600' : 'text-neutral-400'"
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
            class="flex items-center gap-2 px-4 py-2 bg-neutral-50 border-b border-neutral-100 text-xs text-neutral-500"
          >
            <i class="pi pi-lock"></i>
            Peran ini nonaktif. Semua hak akses dikunci dan tidak berlaku sampai diaktifkan kembali.
          </div>

          <table
            class="w-full text-sm"
            :class="{ 'opacity-50 pointer-events-none': activeRole.status === 'inactive' }"
          >
            <thead>
              <tr class="text-left border-b border-neutral-100 bg-neutral-50">
                <th class="py-3 px-4 font-semibold text-xs text-neutral-500">MODUL</th>
                <th
                  v-for="key in permissionKeys"
                  :key="key"
                  class="py-3 px-4 font-semibold text-xs text-neutral-500 text-center"
                >
                  {{ permissionLabels[key] }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="mod in modules"
                :key="mod.key"
                class="border-b border-neutral-50"
              >
                <td class="py-3 px-4 font-medium text-neutral-800">{{ mod.label }}</td>
                <td
                  v-for="key in permissionKeys"
                  :key="key"
                  class="py-3 px-4 text-center"
                >
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

<style scoped>
.role-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--color-neutral-500, #6b7280);
}

.permission-title {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--color-neutral-800, #1f2937);
  margin-bottom: 2px;
}

.icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-neutral-500, #6b7280);
  background: var(--color-neutral-100, #f3f4f6);
}
.icon-btn:hover {
  background: var(--color-neutral-200, #e5e7eb);
}

.role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.875rem;
  color: var(--color-neutral-600, #4b5563);
  background: transparent;
}
.role-item:hover {
  background: var(--color-neutral-50, #f9fafb);
}
.role-item-active {
  background: var(--color-neutral-100, #f3f4f6);
  color: var(--color-neutral-900, #111827);
  font-weight: 600;
  border-left: 3px solid var(--color-neutral-800, #1f2937);
}
</style>