<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Checkbox from 'primevue/checkbox'
import Select from 'primevue/select'
import Card from 'primevue/card'
import AppButton from '@/components/common/AppButton.vue'
import {
  getPermissions,
  getUserPermissions,
  getUsers,
  grantUserPermission,
  revokeUserPermission,
} from '@/services/rbac.service'
import { getListCache, setListCache } from '@/services/list-cache'

const toast = useToast()
const cachedUsers = getListCache('users')
const cachedPermissions = getListCache('permissions')
const users = ref(cachedUsers ?? [])
const permissions = ref(cachedPermissions ?? [])
const selectedUserId = ref(null)
const selectedPermissionIds = ref([])
const initialPermissionIds = ref([])
const loading = ref(!cachedUsers && !cachedPermissions)
const saving = ref(false)

const selectedUser = computed(() => users.value.find((user) => user.user_id === selectedUserId.value))

async function loadData({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const [userData, permissionData] = await Promise.all([getUsers(), getPermissions()])
    users.value = userData
    permissions.value = permissionData
    setListCache('users', userData)
    setListCache('permissions', permissionData)
    selectedUserId.value = selectedUserId.value ?? users.value[0]?.user_id ?? null
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat data', detail: error.response?.data?.message ?? 'Periksa koneksi backend.', life: 4000 })
  } finally {
    if (!background) loading.value = false
  }
}

async function loadUserPermissions(userId) {
  if (!userId) {
    selectedPermissionIds.value = []
    initialPermissionIds.value = []
    return
  }

  try {
    const rows = await getUserPermissions(userId)
    const ids = rows.map((row) => row.permission_id ?? row.permissions?.permission_id)
    selectedPermissionIds.value = ids.filter(Boolean)
    initialPermissionIds.value = [...selectedPermissionIds.value]
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat override user', detail: error.response?.data?.message ?? 'Periksa koneksi backend.', life: 4000 })
  }
}

async function save() {
  if (!selectedUserId.value) return
  saving.value = true
  try {
    const before = new Set(initialPermissionIds.value)
    const after = new Set(selectedPermissionIds.value)
    const grants = [...after].filter((id) => !before.has(id))
    const revokes = [...before].filter((id) => !after.has(id))

    await Promise.all([
      ...grants.map((id) => grantUserPermission(selectedUserId.value, id)),
      ...revokes.map((id) => revokeUserPermission(selectedUserId.value, id)),
    ])
    await loadUserPermissions(selectedUserId.value)
    toast.add({ severity: 'success', summary: 'Override permission disimpan', life: 2500 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal menyimpan override', detail: error.response?.data?.message ?? 'Periksa koneksi backend.', life: 4000 })
  } finally {
    saving.value = false
  }
}

onMounted(() => loadData({ background: Boolean(cachedUsers || cachedPermissions) }))
watch(selectedUserId, loadUserPermissions)
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-4">
    <Card>
      <template #title>Pilih Pengguna</template>
      <template #content>
        <Select
          v-model="selectedUserId"
          :options="users"
          option-label="full_name"
          option-value="user_id"
          placeholder="Pilih pengguna"
          fluid
          :loading="loading"
        />
        <p v-if="selectedUser" class="text-sm text-gray-500 mt-3 mb-0">
          {{ selectedUser.email }}
        </p>
      </template>
    </Card>

    <Card>
      <template #title>Override Permission User</template>
      <template #content>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            v-for="permission in permissions"
            :key="permission.permission_id"
            class="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
          >
            <Checkbox
              v-model="selectedPermissionIds"
              :value="permission.permission_id"
              :binary="false"
            />
            <span>
              <span class="block font-medium text-gray-800">{{ permission.name }}</span>
              <span class="block text-xs text-gray-500">{{ permission.slug }}</span>
            </span>
          </label>
        </div>
        <div class="flex justify-end mt-4">
          <AppButton label="Simpan Perubahan" variant="dark" :loading="saving" @click="save" />
        </div>
      </template>
    </Card>
  </div>
</template>
