<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import AppButton from '@/components/common/AppButton.vue'
import {
  createPermission,
  deletePermission,
  getPermissions,
  updatePermission,
} from '@/services/rbac.service'
import { getListCache, setListCache, updateListCache } from '@/services/list-cache'

const confirm = useConfirm()
const toast = useToast()
const cachedPermissions = getListCache('permissions')
const permissions = ref(cachedPermissions ?? [])
const loading = ref(!cachedPermissions)
const saving = ref(false)
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', slug: '', description: '' })

async function loadPermissions({ background = false } = {}) {
  if (!background) loading.value = true
  try {
    const data = await getPermissions()
    permissions.value = data
    setListCache('permissions', data)
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal memuat permission', detail: error.response?.data?.message ?? 'Periksa koneksi backend.', life: 4000 })
  } finally {
    if (!background) loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { name: '', slug: '', description: '' })
  dialogVisible.value = true
}

function openEdit(permission) {
  editingId.value = permission.permission_id
  Object.assign(form, permission)
  dialogVisible.value = true
}

async function save() {
  if (!form.name.trim() || !form.slug.trim()) return
  saving.value = true
  try {
    const saved = editingId.value
      ? await updatePermission(editingId.value, form)
      : await createPermission(form)
    updateListCache('permissions', (items) => editingId.value
      ? items.map((item) => item.permission_id === editingId.value ? { ...item, ...saved } : item)
      : [saved, ...items])
    permissions.value = editingId.value
      ? permissions.value.map((item) => item.permission_id === editingId.value ? { ...item, ...saved } : item)
      : [saved, ...permissions.value]
    dialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Permission berhasil disimpan', life: 2500 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Gagal menyimpan permission', detail: error.response?.data?.message ?? 'Periksa data permission.', life: 4000 })
  } finally {
    saving.value = false
  }
}

function remove(permission) {
  confirm.require({
    message: `Hapus permission "${permission.name}"?`,
    header: 'Konfirmasi Hapus',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deletePermission(permission.permission_id)
        permissions.value = permissions.value.filter((item) => item.permission_id !== permission.permission_id)
        setListCache('permissions', (items) => items.filter((item) => item.permission_id !== permission.permission_id))
        toast.add({ severity: 'success', summary: 'Permission berhasil dihapus', life: 2500 })
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Gagal menghapus permission', detail: error.response?.data?.message ?? 'Permission mungkin masih digunakan.', life: 4000 })
      }
    },
  })
}

onMounted(() => loadPermissions({ background: Boolean(cachedPermissions) }))
</script>

<template>
  <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800 mb-1">Daftar Permission</h1>
        <p class="text-sm text-gray-500 mb-0">Kelola permission yang tersedia di sistem.</p>
      </div>
      <AppButton label="Tambah Permission" icon="pi pi-plus" variant="dark" @click="openCreate" />
    </div>

    <DataTable :value="permissions" :loading="loading" data-key="permission_id" responsive-layout="scroll">
      <Column field="name" header="Nama" sortable />
      <Column field="slug" header="Slug" sortable />
      <Column field="description" header="Deskripsi" />
      <Column header="Aksi" header-style="width: 7rem">
        <template #body="{ data }">
          <div class="flex gap-2">
            <AppButton icon="pi pi-pencil" variant="ghost" aria-label="Edit" @click="openEdit(data)" />
            <AppButton icon="pi pi-trash" variant="ghost" aria-label="Hapus" @click="remove(data)" />
          </div>
        </template>
      </Column>
      <template #empty><p class="text-center text-gray-400 py-8">Belum ada permission.</p></template>
    </DataTable>

    <Dialog v-model:visible="dialogVisible" modal :header="editingId ? 'Edit Permission' : 'Tambah Permission'" :style="{ width: '32rem', maxWidth: '95vw' }">
      <div class="flex flex-col gap-3">
        <InputText v-model="form.name" placeholder="Nama permission" />
        <InputText v-model="form.slug" placeholder="Slug (contoh: berita)" />
        <InputText v-model="form.description" placeholder="Deskripsi (opsional)" />
      </div>
      <template #footer>
        <AppButton label="Batal" variant="outline" @click="dialogVisible = false" />
        <AppButton label="Simpan" variant="dark" :loading="saving" @click="save" />
      </template>
    </Dialog>
  </div>
</template>
