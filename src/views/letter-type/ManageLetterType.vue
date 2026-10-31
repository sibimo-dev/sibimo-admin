<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useLetterTypeStore()

const isNew = computed(() => route.params.id === 'new' || !route.params.id)
const isLoading = ref(false)
const isSaving = ref(false)
const requirements = ref([])

const form = reactive({
  letter_type_id: null,
  code: '',
  letter_name: '',
  category: '',
  number_prefix: '',
  classification_index: '',
  processing_time: '',
  signature_method: 'manual',
  signer_id: null,
  description: '',
  is_active: true,
})

const categoryOptions = ['Perintah', 'Keterangan', 'Pengantar', 'Permohonan', 'Pernyataan']
const signatureMethodOptions = [
  { label: 'Manual', value: 'manual' },
  { label: 'Digital', value: 'digital' },
]
const signerOptions = computed(() =>
  store.signers.value.map((signer) => ({
    value: signer.staff_id,
    label: signer.name + ' - ' + signer.position,
  })),
)

// Edit mode: only classification index, number prefix, and description can be changed
const lockedFields = computed(() => !isNew.value)

// ====== Letter type (basic info) ======
async function loadRelatedData() {
  if (isNew.value) return
  const routeId = route.params.id
  const type = await store.fetchById(routeId)
  const letterTypeId = type?.letter_type_id ?? type?.id ?? routeId
  Object.assign(form, type, { letter_type_id: letterTypeId })
  requirements.value = await store.getDocuments(letterTypeId)
}

onMounted(async () => {
  isLoading.value = true
  try {
    await store.fetchSigners()
    await loadRelatedData()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat tipe surat',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 3000,
    })
    if (!isNew.value) router.push({ name: 'letter-type-list' })
  } finally {
    isLoading.value = false
  }
})

async function handleSave() {
  if (!form.code || !form.letter_name || !form.category || !form.signature_method) {
    toast.add({ severity: 'warn', summary: 'Lengkapi field wajib', life: 2500 })
    return
  }

  isSaving.value = true
  try {
    const payload = {
      code: form.code,
      letter_name: form.letter_name,
      category: form.category,
      number_prefix: form.number_prefix || null,
      classification_index: form.classification_index || null,
      processing_time: form.processing_time || null,
      signature_method: form.signature_method,
      signer_id: form.signer_id || null,
      description: form.description || null,
      is_active: form.is_active,
    }
    const letterTypeId = form.letter_type_id ?? route.params.id
    const saved = isNew.value
      ? await store.addLetterType(payload)
      : await store.updateLetterType(letterTypeId, payload)

    toast.add({ severity: 'success', summary: 'Tipe surat berhasil disimpan', life: 2000 })
    if (isNew.value) {
      router.replace({ name: 'letter-type-manage', params: { id: saved.letter_type_id } })
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan tipe surat',
      detail: error.response?.data?.message ?? 'Periksa data yang dikirim.',
      life: 3000,
    })
  } finally {
    isSaving.value = false
  }
}

// ====== Requirement documents (CRUD) ======
const requirementForm = reactive({
  id: null,
  document_name: '',
  description: '',
  is_required: false,
})

const isRequirementDialogVisible = ref(false)
const isRequirementSubmitted = ref(false)
const isSavingRequirement = ref(false)

const isEditingRequirement = computed(() => Boolean(requirementForm.id))
const isRequirementNameInvalid = computed(
  () => isRequirementSubmitted.value && !requirementForm.document_name.trim(),
)

const requiredCount = computed(() => requirements.value.filter((item) => item.is_required).length)
const optionalCount = computed(() => requirements.value.length - requiredCount.value)

function resetRequirementForm() {
  Object.assign(requirementForm, {
    id: null,
    document_name: '',
    description: '',
    is_required: false,
  })
  isRequirementSubmitted.value = false
}

async function refreshRequirements() {
  const letterTypeId = form.letter_type_id ?? route.params.id
  if (!letterTypeId) return
  requirements.value = await store.getDocuments(letterTypeId)
}

// Create
function openCreateRequirement() {
  resetRequirementForm()
  isRequirementDialogVisible.value = true
}

// Update
function openEditRequirement(item) {
  Object.assign(requirementForm, {
    id: item.letter_type_document_id,
    document_name: item.document_name,
    description: item.description ?? '',
    is_required: Boolean(item.is_required),
  })
  isRequirementSubmitted.value = false
  isRequirementDialogVisible.value = true
}

function closeRequirementDialog() {
  isRequirementDialogVisible.value = false
  resetRequirementForm()
}

async function saveRequirement() {
  isRequirementSubmitted.value = true
  const letterTypeId = form.letter_type_id ?? route.params.id
  if (isNew.value || !letterTypeId || !requirementForm.document_name.trim()) return

  isSavingRequirement.value = true
  try {
    const payload = {
      document_name: requirementForm.document_name.trim(),
      description: requirementForm.description?.trim() || null,
      is_required: requirementForm.is_required,
    }
    if (requirementForm.id) await store.updateDocument(requirementForm.id, payload)
    else await store.createDocument(letterTypeId, payload)

    await refreshRequirements()
    toast.add({
      severity: 'success',
      summary: isEditingRequirement.value ? 'Dokumen persyaratan diperbarui' : 'Dokumen persyaratan ditambahkan',
      life: 1800,
    })
    closeRequirementDialog()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan dokumen persyaratan',
      detail: error.response?.data?.message ?? 'Periksa data yang dikirim.',
      life: 2500,
    })
  } finally {
    isSavingRequirement.value = false
  }
}

// Delete
const isDeleteDialogVisible = ref(false)
const isDeleting = ref(false)
const requirementToDelete = ref(null)

function confirmRemoveRequirement(item) {
  requirementToDelete.value = item
  isDeleteDialogVisible.value = true
}

async function removeRequirement() {
  if (!requirementToDelete.value) return

  isDeleting.value = true
  try {
    await store.deleteDocument(requirementToDelete.value.letter_type_document_id)
    await refreshRequirements()
    toast.add({ severity: 'success', summary: 'Dokumen persyaratan dihapus', life: 1800 })
    isDeleteDialogVisible.value = false
    requirementToDelete.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menghapus dokumen persyaratan',
      detail: error.response?.data?.message ?? undefined,
      life: 2500,
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header (sama seperti halaman lain) -->
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 class="m-0 text-2xl font-bold text-primary-900">{{ isNew ? 'Tambah' : 'Kelola' }} Tipe Surat</h1>
        <p class="m-0 mt-1 text-sm text-neutral-500">
          {{ isNew ? 'Isi informasi dasar untuk membuat tipe surat baru.' : form.letter_name || 'Konfigurasi tipe surat.' }}
        </p>
      </div>
      <Button
        label="Kembali"
        icon="pi pi-arrow-left"
        severity="secondary"
        outlined
        class="self-start sm:self-auto"
        @click="router.push({ name: 'letter-type-list' })"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading" class="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <Skeleton width="30%" height="1.5rem" />
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton v-for="n in 6" :key="n" height="2.75rem" />
      </div>
      <Skeleton height="6rem" />
    </div>

    <template v-else>
      <!-- Basic information -->
      <section class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div class="flex items-center gap-3 border-b border-neutral-100 bg-neutral-50/70 px-6 py-4">
          <span class="h-8 w-1 rounded-full bg-primary-600"></span>
          <div>
            <h2 class="m-0 text-base font-semibold text-neutral-800">Informasi Dasar</h2>
            <p class="m-0 text-xs text-neutral-500">Data utama yang menjelaskan tipe surat ini.</p>
          </div>
        </div>

        <div class="space-y-5 p-6">
          <Message v-if="!isNew" severity="info" size="small" :closable="false">
            Hanya <span class="font-semibold">Indeks Klasifikasi Arsip</span>,
            <span class="font-semibold">Prefix Lama</span>, dan
            <span class="font-semibold">Deskripsi</span> yang dapat diubah.
          </Message>

          <div class="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label for="code" class="text-sm font-medium text-neutral-600">
                Kode Tipe Surat <span v-if="isNew" class="text-red-500">*</span>
              </label>
              <InputText id="code" v-model="form.code" :disabled="lockedFields" placeholder="Contoh: SK-DOM" fluid />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="letter_name" class="text-sm font-medium text-neutral-600">
                Nama Tipe Surat <span v-if="isNew" class="text-red-500">*</span>
              </label>
              <InputText
                id="letter_name"
                v-model="form.letter_name"
                :disabled="lockedFields"
                placeholder="Contoh: Surat Keterangan Domisili"
                fluid
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="category" class="text-sm font-medium text-neutral-600">
                Kategori <span v-if="isNew" class="text-red-500">*</span>
              </label>
              <Select
                v-model="form.category"
                input-id="category"
                :options="categoryOptions"
                :disabled="lockedFields"
                placeholder="Pilih kategori"
                fluid
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="processing_time" class="text-sm font-medium text-neutral-600">Estimasi Proses</label>
              <InputText
                id="processing_time"
                v-model="form.processing_time"
                :disabled="lockedFields"
                placeholder="Contoh: 1-2 hari kerja"
                fluid
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="signature_method" class="text-sm font-medium text-neutral-600">
                Metode Tanda Tangan <span v-if="isNew" class="text-red-500">*</span>
              </label>
              <Select
                v-model="form.signature_method"
                input-id="signature_method"
                :options="signatureMethodOptions"
                option-label="label"
                option-value="value"
                :disabled="lockedFields"
                fluid
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="signer_id" class="text-sm font-medium text-neutral-600">Penandatangan</label>
              <Select
                v-model="form.signer_id"
                input-id="signer_id"
                :options="signerOptions"
                option-label="label"
                option-value="value"
                :disabled="lockedFields"
                placeholder="Pilih penandatangan"
                filter
                show-clear
                fluid
              />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="classification_index" class="text-sm font-medium text-neutral-600">
                Indeks Klasifikasi Arsip
              </label>
              <InputText id="classification_index" v-model="form.classification_index" placeholder="Contoh: 400.12" fluid />
            </div>

            <div class="flex flex-col gap-1.5">
              <label for="number_prefix" class="text-sm font-medium text-neutral-600">Prefix Lama (internal)</label>
              <InputText id="number_prefix" v-model="form.number_prefix" fluid />
            </div>

            <div class="flex flex-col gap-1.5 md:col-span-2">
              <label for="description" class="text-sm font-medium text-neutral-600">Deskripsi</label>
              <Textarea
                id="description"
                v-model="form.description"
                rows="3"
                auto-resize
                placeholder="Deskripsi tipe surat"
                fluid
              />
            </div>

            <div
              class="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 md:col-span-2"
              :class="lockedFields ? 'opacity-60' : ''"
            >
              <div>
                <p class="m-0 text-sm font-medium text-neutral-700">Status Tipe Surat</p>
                <p class="m-0 text-xs text-neutral-500">
                  {{ form.is_active ? 'Aktif dan dapat diajukan oleh warga.' : 'Nonaktif dan tidak tampil untuk warga.' }}
                </p>
              </div>
              <ToggleSwitch v-model="form.is_active" :disabled="lockedFields" input-id="is_active" />
            </div>
          </div>
        </div>

        <div class="flex justify-end border-t border-neutral-100 bg-neutral-50/70 px-6 py-4">
          <Button
            :label="isSaving ? 'Menyimpan...' : 'Simpan Tipe Surat'"
            icon="pi pi-save"
            :loading="isSaving"
            :disabled="isSaving"
            @click="handleSave"
          />
        </div>
      </section>

      <!-- Requirement documents -->
      <section class="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div
          class="flex flex-col justify-between gap-3 border-b border-neutral-100 bg-neutral-50/70 px-6 py-4 sm:flex-row sm:items-center"
        >
          <div class="flex items-center gap-3">
            <span class="h-8 w-1 rounded-full bg-primary-600"></span>
            <div>
              <h2 class="m-0 text-base font-semibold text-neutral-800">Dokumen Persyaratan</h2>
              <p class="m-0 text-xs text-neutral-500">Dokumen yang harus dilampirkan warga saat mengajukan surat.</p>
            </div>
          </div>
          <Button
            v-if="!isNew"
            label="Tambah Dokumen"
            icon="pi pi-plus"
            size="small"
            @click="openCreateRequirement"
          />
        </div>

        <!-- New letter type: requirements not available yet -->
        <div v-if="isNew" class="p-6">
          <div class="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-10 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
              <i class="pi pi-lock text-xl"></i>
            </div>
            <p class="m-0 font-medium text-neutral-600">Simpan tipe surat terlebih dahulu</p>
            <p class="m-0 text-sm text-neutral-400">Dokumen persyaratan dapat ditambahkan setelah tipe surat tersimpan.</p>
          </div>
        </div>

        <div v-else class="space-y-4 p-6">
          <!-- Summary -->
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-600">
              Total: {{ requirements.length }}
            </span>
            <span class="rounded-full bg-red-50 px-3 py-1 font-medium text-red-600">Wajib: {{ requiredCount }}</span>
            <span class="rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-500">
              Opsional: {{ optionalCount }}
            </span>
          </div>

          <div class="overflow-x-auto rounded-xl border border-neutral-200">
            <DataTable
              :value="requirements"
              data-key="letter_type_document_id"
              row-hover
              size="small"
              :pt="{
                bodyRow: { class: 'border-b border-neutral-100 bg-white transition-colors duration-150 last:border-b-0 hover:bg-primary-50' },
              }"
            >
              <Column header="No" class="w-16">
                <template #body="{ index }">
                  <span class="text-neutral-500">{{ index + 1 }}</span>
                </template>
              </Column>

              <Column field="document_name" header="Nama Dokumen">
                <template #body="{ data }">
                  <div class="flex items-center gap-2.5 py-1">
                    <i class="pi pi-file text-neutral-400"></i>
                    <span class="font-medium text-neutral-800">{{ data.document_name }}</span>
                  </div>
                </template>
              </Column>

              <Column field="description" header="Deskripsi">
                <template #body="{ data }">
                  <span v-if="data.description" class="text-neutral-600">{{ data.description }}</span>
                  <span v-else class="italic text-neutral-400">Tanpa deskripsi</span>
                </template>
              </Column>

              <Column header="Status">
                <template #body="{ data }">
                  <Tag
                    :value="data.is_required ? 'Wajib' : 'Opsional'"
                    :severity="data.is_required ? 'danger' : 'secondary'"
                    rounded
                  />
                </template>
              </Column>

              <Column header="Aksi" class="w-44">
                <template #body="{ data }">
                  <div class="flex items-center gap-1.5">
                    <Button
                      label="Edit"
                      icon="pi pi-pencil"
                      size="small"
                      outlined
                      class="rounded-lg border-primary-300 px-2.5 py-1 text-[12px] font-medium text-primary-700 hover:border-primary-700 hover:bg-primary-700 hover:text-white"
                      aria-label="Edit dokumen"
                      @click="openEditRequirement(data)"
                    />
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      title="Hapus"
                      aria-label="Hapus dokumen"
                      @click="confirmRemoveRequirement(data)"
                    />
                  </div>
                </template>
              </Column>

              <template #empty>
                <div class="flex flex-col items-center gap-2 py-10 text-center">
                  <div class="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
                    <i class="pi pi-folder-open text-xl"></i>
                  </div>
                  <p class="m-0 font-medium text-neutral-600">Belum ada dokumen persyaratan</p>
                  <p class="m-0 text-sm text-neutral-400">Klik "Tambah Dokumen" untuk menambahkan persyaratan pertama.</p>
                </div>
              </template>
            </DataTable>
          </div>
        </div>
      </section>
    </template>

    <!-- Dialog: create / edit requirement -->
    <Dialog
      v-model:visible="isRequirementDialogVisible"
      modal
      :header="isEditingRequirement ? 'Edit Dokumen Persyaratan' : 'Tambah Dokumen Persyaratan'"
      class="w-[28rem] max-w-[95vw]"
      :draggable="false"
      :closable="!isSavingRequirement"
      @hide="resetRequirementForm"
    >
      <div class="space-y-4 pt-1">
        <div class="flex flex-col gap-1.5">
          <label for="document_name" class="text-sm font-medium text-neutral-600">
            Nama Dokumen <span class="text-red-500">*</span>
          </label>
          <InputText
            id="document_name"
            v-model="requirementForm.document_name"
            placeholder="Contoh: Fotokopi KTP"
            :invalid="isRequirementNameInvalid"
            fluid
            @keyup.enter="saveRequirement"
          />
          <small v-if="isRequirementNameInvalid" class="text-red-500">Nama dokumen wajib diisi.</small>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="document_description" class="text-sm font-medium text-neutral-600">Deskripsi</label>
          <Textarea
            id="document_description"
            v-model="requirementForm.description"
            rows="3"
            auto-resize
            placeholder="Keterangan tambahan (opsional)"
            fluid
          />
        </div>

        <div class="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
          <div>
            <p class="m-0 text-sm font-medium text-neutral-700">Dokumen Wajib</p>
            <p class="m-0 text-xs text-neutral-500">
              {{ requirementForm.is_required ? 'Warga wajib melampirkan dokumen ini.' : 'Dokumen ini bersifat opsional.' }}
            </p>
          </div>
          <ToggleSwitch v-model="requirementForm.is_required" />
        </div>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          text
          :disabled="isSavingRequirement"
          @click="closeRequirementDialog"
        />
        <Button
          :label="isEditingRequirement ? 'Simpan Perubahan' : 'Simpan Dokumen'"
          icon="pi pi-check"
          :loading="isSavingRequirement"
          @click="saveRequirement"
        />
      </template>
    </Dialog>

    <!-- Dialog: delete confirmation -->
    <Dialog
      v-model:visible="isDeleteDialogVisible"
      modal
      header="Hapus Dokumen Persyaratan"
      class="w-[26rem] max-w-[95vw]"
      :draggable="false"
      :closable="!isDeleting"
    >
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
          <i class="pi pi-exclamation-triangle text-lg"></i>
        </div>
        <p class="m-0 text-sm text-neutral-600">
          Yakin ingin menghapus
          <span class="font-semibold text-neutral-800">{{ requirementToDelete?.document_name }}</span>
          dari daftar persyaratan? Tindakan ini tidak dapat dibatalkan.
        </p>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          text
          :disabled="isDeleting"
          @click="isDeleteDialogVisible = false"
        />
        <Button label="Hapus" icon="pi pi-trash" severity="danger" :loading="isDeleting" @click="removeRequirement" />
      </template>
    </Dialog>
  </div>
</template>
