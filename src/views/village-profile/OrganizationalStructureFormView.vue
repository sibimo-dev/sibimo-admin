<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import {
  getOrganizationalStructures,
  saveOrganizationalStructure,
} from '@/services/profile.service'

const toast = useToast()
const saving = ref(false)

const isEdit = computed(() => !!form.organizational_structure_id)
const pageTitle = computed(() => (isEdit.value ? 'Edit Struktur Organisasi' : 'Tambah Struktur Organisasi'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Terbitkan'))

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

/* Daftar jabatan bawaan, sesuai struktur yang ditampilkan di halaman publik.
   `level` menentukan pengelompokan, `pimpinan`/`slider`/`centerOnDesktop`
   menentukan gaya kartu di halaman publik. */
const JABATAN_OPTIONS = [
  { label: 'Lurah', level: 'Lurah', pimpinan: true },
  { label: 'Carik', level: 'Carik', pimpinan: true },
  { label: 'Kaur Danarta', level: 'Kepala Urusan (Sekretariat & Keuangan)' },
  { label: 'Kaur Tata Laksana', level: 'Kepala Urusan (Sekretariat & Keuangan)' },
  { label: 'Kaur Pangripta', level: 'Kepala Urusan (Sekretariat & Keuangan)' },
  { label: 'Kamituwa', level: 'Kepala Seksi' },
  { label: 'Ulu-Ulu', level: 'Kepala Seksi' },
  { label: 'Jagabaya', level: 'Kepala Seksi' },
  { label: 'Dukuh I Krebet', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh II Rogobangsan', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh III Kalibulus', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh IV Macanan', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh V Cokrogaten', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh VI Purwobinangun', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh VII Pondok Suruh', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh VIII Balong', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh IX Kragilan', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh X Banjarharjo', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh XI Sorasan', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Dukuh XII Koroulon Kidul', level: 'Dukuh (Kepala Padukuhan)', slider: true },
  { label: 'Staff Pamong Kalurahan', level: 'Staff Pamong Kalurahan', slider: true, centerOnDesktop: true },
]

function uid() {
  return crypto.randomUUID()
}

function initials(name) {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?'
}

/* Jabatan kustom yang pernah ditambahkan admin (di luar JABATAN_OPTIONS).
   Kalau sedang mengedit konten lama, rekonstruksi ulang dari data levels
   yang tersimpan supaya tetap muncul di pilihan Select. */
function seedCustomJabatan(existingLevels = []) {
  if (!Array.isArray(existingLevels)) return []
  const custom = []
  existingLevels.forEach((lvl) => {
    ;(lvl.people ?? []).forEach((p) => {
      const known = JABATAN_OPTIONS.some((o) => o.label === p.title)
      if (!known && p.title && !custom.some((c) => c.label === p.title)) {
        custom.push({
          label: p.title,
          level: lvl.level,
          pimpinan: !!lvl.pimpinan,
          slider: !!lvl.slider,
          centerOnDesktop: !!lvl.centerOnDesktop,
        })
      }
    })
  })
  return custom
}

const customJabatan = reactive([])
const allJabatanOptions = computed(() => [...JABATAN_OPTIONS, ...customJabatan])
const existingLevelChoices = computed(() => {
  const seen = new Set()
  const list = []
  allJabatanOptions.value.forEach((o) => {
    if (!seen.has(o.level)) {
      seen.add(o.level)
      list.push({ label: o.level, value: o.level })
    }
  })
  return list
})

/* ---- Form tambah opsi jabatan baru (bukan anggotanya) ---- */
const showAddJabatan = ref(false)
const newJabatan = reactive({ nama: '', level: null })

function openAddJabatan() {
  showAddJabatan.value = true
}
function cancelAddJabatan() {
  showAddJabatan.value = false
  newJabatan.nama = ''
  newJabatan.level = null
}
function confirmAddJabatan() {
  const nama = newJabatan.nama.trim()
  const level = (newJabatan.level || '').trim()
  if (!nama || !level) {
    toast.add({ severity: 'error', summary: 'Isi nama jabatan dan kelompoknya terlebih dahulu', life: 2500 })
    return
  }
  const isDuplicate = allJabatanOptions.value.some((o) => o.label.toLowerCase() === nama.toLowerCase())
  if (isDuplicate) {
    toast.add({ severity: 'error', summary: 'Jabatan tersebut sudah ada', life: 2500 })
    return
  }
  customJabatan.push({ label: nama, level })
  toast.add({ severity: 'success', summary: 'Jabatan baru ditambahkan', life: 2000 })
  cancelAddJabatan()
}

/* Ratakan data levels (kalau sedang edit konten yang sudah ada) jadi daftar
   orang datar, supaya cocok dengan bentuk form yang baru. */
function seedPeople(existingLevels = []) {
  if (Array.isArray(existingLevels) && existingLevels.length) {
    return existingLevels.flatMap((lvl) =>
      (lvl.people ?? []).map((p) => ({
        id: uid(),
        jabatan: p.title ?? null,
        nama: p.name ?? '',
        desc: p.desc ?? '',
        photo: p.photo ?? null,
        photoFile: null,
      }))
    )
  }
  return [{ id: uid(), jabatan: null, nama: '', desc: '', photo: null, photoFile: null }]
}

const form = reactive({
  organizational_structure_id: null,
  title: 'Struktur Organisasi Pemerintah Desa',
  status: 'Draft',
  published_at: null,
  people: seedPeople(),
})

function loadExisting(content) {
  if (!content) return
  Object.assign(form, {
    organizational_structure_id: content.organizational_structure_id,
    title: content.title ?? 'Struktur Organisasi Pemerintah Desa',
    status: content.status ?? 'Draft',
    published_at: content.published_at ?? null,
  })
  customJabatan.splice(0, customJabatan.length, ...seedCustomJabatan(content.levels ?? []))
  form.people = seedPeople(content.levels ?? [])
}

onMounted(async () => {
  try {
    const structures = await getOrganizationalStructures()
    loadExisting(structures[0])
  } catch (error) {
    toast.add({ severity: 'error', summary: error.response?.data?.message ?? 'Gagal memuat struktur organisasi', life: 3000 })
  }
})

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

/* ---- Baris orang ---- */
function addPerson() {
  form.people.push({ id: uid(), jabatan: null, nama: '', desc: '', photo: null, photoFile: null })
}
function removePerson(personId) {
  form.people = form.people.filter((p) => p.id !== personId)
}

/* ---- Unggah foto per orang (satu input file tersembunyi, dipakai bersama) ---- */
const globalFileInput = ref(null)
const pendingPhotoTarget = ref(null)

function triggerPersonPhoto(personId) {
  pendingPhotoTarget.value = personId
  globalFileInput.value?.click()
}

function onGlobalFileChange(event) {
  const file = event.target.files?.[0]
  const targetId = pendingPhotoTarget.value
  event.target.value = ''
  if (!file || !targetId) return

  const person = form.people.find((p) => p.id === targetId)
  if (!person) return

  const reader = new FileReader()
  reader.onload = () => {
    person.photo = reader.result
    person.photoFile = file
  }
  reader.readAsDataURL(file)
}

/* ---- Kelompokkan daftar orang datar menjadi levels sesuai urutan &
   gaya kartu yang dipakai halaman publik ---- */
function buildLevels() {
  const options = allJabatanOptions.value
  const order = []
  const levelMeta = new Map()

  options.forEach((opt) => {
    if (!levelMeta.has(opt.level)) {
      order.push(opt.level)
      levelMeta.set(opt.level, { pimpinan: false, slider: false, centerOnDesktop: false })
    }
    const meta = levelMeta.get(opt.level)
    if (opt.pimpinan) meta.pimpinan = true
    if (opt.slider) meta.slider = true
    if (opt.centerOnDesktop) meta.centerOnDesktop = true
  })

  const buckets = new Map(order.map((lvl) => [lvl, []]))
  people.value.forEach((p) => {
    if (!p.jabatan || !p.nama.trim()) return
    const opt = options.find((o) => o.label === p.jabatan)
    if (!opt) return
    buckets.get(opt.level).push({
      name: p.nama,
      title: p.jabatan,
      desc: p.desc || '',
      photo: p.photoFile ? `upload:${p.id}` : p.photo,
    })
  })

  return order
    .filter((lvl) => buckets.get(lvl).length)
    .map((lvl) => ({ level: lvl, ...levelMeta.get(lvl), people: buckets.get(lvl) }))
}

/* Setiap aksi CRUD langsung ditulis ke orgStructureContent — tidak ada
   tombol "Simpan Draft" / "Terbitkan" terpisah lagi. */
function syncToStore() {
  if (!metaPublishedAt) {
    metaPublishedAt = new Date().toISOString().slice(0, 10)
  }
  metaProfileContentId = metaProfileContentId ?? Date.now()

  orgStructureContent.value = {
    profile_content_id: metaProfileContentId,
    title: metaTitle,
    levels: buildLevels(),
    status: metaStatus,
    published_at: metaPublishedAt,
  }
}

/* ========================================================================
   CRUD anggota struktur organisasi — daftar (DataTable) + modal (Dialog)
   ======================================================================== */

const selectedPeople = ref([])

const personDialogVisible = ref(false)
const editingPersonId = ref(null)
const personDialogTitle = computed(() => (editingPersonId.value ? 'Edit Pamong' : 'Tambah Pamong'))

const emptyPersonForm = () => ({ jabatan: null, nama: '', desc: '', photo: null })
const personForm = reactive(emptyPersonForm())

function openNewPerson() {
  editingPersonId.value = null
  Object.assign(personForm, emptyPersonForm())
  personDialogVisible.value = true
}

function openEditPerson(person) {
  editingPersonId.value = person.id
  Object.assign(personForm, {
    jabatan: person.jabatan,
    nama: person.nama,
    desc: person.desc,
    photo: person.photo,
  })
  personDialogVisible.value = true
}

function closePersonDialog() {
  personDialogVisible.value = false
  editingPersonId.value = null
  Object.assign(personForm, emptyPersonForm())
}

function savePersonDialog() {
  const nama = personForm.nama.trim()
  if (!personForm.jabatan || !nama) {
    toast.add({ severity: 'error', summary: 'Jabatan dan nama wajib diisi', life: 2500 })
    return
  }

  if (editingPersonId.value) {
    // Reassign array (bukan mutasi in-place) supaya tabel pasti langsung refresh.
    people.value = people.value.map((p) =>
      p.id === editingPersonId.value
        ? { ...p, jabatan: personForm.jabatan, nama, desc: personForm.desc.trim(), photo: personForm.photo }
        : p
    )
    toast.add({ severity: 'success', summary: 'Pamong diperbarui', life: 2000 })
  } else {
    const newPerson = {
      id: uid(),
      jabatan: personForm.jabatan,
      nama,
      desc: personForm.desc.trim(),
      photo: personForm.photo,
    }
    // Reassign array (bukan .push) supaya perubahan pasti terdeteksi dan
    // anggota baru langsung muncul di DataTable.
    people.value = [...people.value, newPerson]
    toast.add({ severity: 'success', summary: 'Pamong ditambahkan', life: 2000 })
  }

    const files = form.people
      .filter((person) => person.photoFile)
      .map((person) => ({ token: person.id, file: person.photoFile }))
    const saved = await saveOrganizationalStructure({
      id: form.organizational_structure_id,
      payload: {
        title: form.title.trim(),
        status: form.status,
        published_at: form.published_at,
        levels: buildLevels(),
      },
      files,
    })
    loadExisting(saved)

function deletePerson(person) {
  confirm.require({
    message: `Hapus "${person.nama}" dari struktur organisasi?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      people.value = people.value.filter((p) => p.id !== person.id)
      selectedPeople.value = selectedPeople.value.filter((p) => p.id !== person.id)
      syncToStore()
      toast.add({ severity: 'success', summary: 'Pamong dihapus', life: 2000 })
    },
  })
}

function deleteSelectedPeople() {
  if (!selectedPeople.value.length) return
  confirm.require({
    message: `Hapus ${selectedPeople.value.length} pamong terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: () => {
      const idsToRemove = new Set(selectedPeople.value.map((p) => p.id))
      people.value = people.value.filter((p) => !idsToRemove.has(p.id))
      selectedPeople.value = []
      syncToStore()
      toast.add({ severity: 'success', summary: 'Pamong terpilih dihapus', life: 2000 })
    },
  })
}

/* ---- Unggah foto (dipakai di dalam modal) ---- */
const personPhotoInput = ref(null)

function triggerPersonPhotoUpload() {
  personPhotoInput.value?.click()
}

function onPersonPhotoChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    personForm.photo = reader.result
  }
  reader.readAsDataURL(file)
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">Struktur Organisasi</h1>
    </div>

    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-700">Daftar Pamong Kalurahan</span>
          <Button
            v-if="!showAddJabatan"
            label="Tambah Jabatan Baru"
            icon="pi pi-plus-circle"
            text
            size="small"
            @click="openAddJabatan"
          />
        </div>
      </template>
      <template #content>
        <!-- Form tambah opsi jabatan baru (bukan anggota) -->
        <div v-if="showAddJabatan" class="mb-4 flex flex-col gap-3 rounded-lg border border-dashed border-blue-200 bg-blue-50/40 p-3">
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">Nama Jabatan Baru</label>
              <InputText v-model="newJabatan.nama" placeholder="mis. Bendahara Desa" size="small" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">Kelompok / Level</label>
              <Select
                v-model="newJabatan.level"
                :options="existingLevelChoices"
                optionLabel="label"
                optionValue="value"
                editable
                filter
                placeholder="Pilih kelompok yang ada atau ketik kelompok baru"
                size="small"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button label="Batal" text size="small" severity="secondary" @click="cancelAddJabatan" />
            <Button label="Simpan Jabatan" icon="pi pi-check" size="small" @click="confirmAddJabatan" />
          </div>
        </div>

        <!-- Toolbar CRUD -->
        <div class="mb-3 flex items-center gap-2">
          <Button label="Tambah Pamong" icon="pi pi-plus" size="small" @click="openNewPerson" />
          <Button
            label="Hapus"
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            :disabled="!selectedPeople.length"
            @click="deleteSelectedPeople"
          />
        </div>

        <!-- Daftar anggota -->
        <DataTable
          v-model:selection="selectedPeople"
          :value="people"
          dataKey="id"
          size="small"
          stripedRows
          :rows="10"
          paginator
          paginatorTemplate="PrevPageLink PageLinks NextPageLink"
          responsiveLayout="scroll"
        >
          <template #empty>
            <div class="py-6 text-center text-sm text-slate-400">
              Belum ada pamong. Klik "Tambah Pamong" untuk mulai.
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" />

          <Column header="Foto" headerStyle="width: 4rem">
            <template #body="{ data }">
              <Avatar
                :image="data.photo || undefined"
                :label="!data.photo ? initials(data.nama) : undefined"
                shape="circle"
                class="!bg-blue-100 !text-blue-700"
              />
            </template>
          </Column>

          <Column field="jabatan" header="Jabatan">
            <template #body="{ data }">
              <span :class="{ 'text-slate-400 italic': !data.jabatan }">
                {{ data.jabatan || 'Belum dipilih' }}
              </span>
            </template>
          </Column>

          <Column field="nama" header="Nama" />

          <Column field="desc" header="Deskripsi">
            <template #body="{ data }">
              <span class="line-clamp-1 text-slate-500">{{ data.desc || '—' }}</span>
            </template>
          </Column>

          <Column header="Aksi" headerStyle="width: 6rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" @click="openEditPerson(data)" aria-label="Edit pamong" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deletePerson(data)" aria-label="Hapus pamong" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modal Tambah / Edit Anggota -->
    <Dialog
      v-model:visible="personDialogVisible"
      modal
      :header="personDialogTitle"
      :style="{ width: '480px' }"
      :closable="true"
      @hide="closePersonDialog"
    >
      <input ref="personPhotoInput" type="file" accept="image/*" class="hidden" @change="onPersonPhotoChange" />

      <div class="flex flex-col gap-4">
        <!-- Upload foto: selebar field lain, preview jelas terlihat -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Foto</label>
          <div class="relative w-full">
            <div
              class="flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:border-blue-400"
              @click="triggerPersonPhotoUpload"
            >
              <img v-if="personForm.photo" :src="personForm.photo" alt="Foto pamong" class="h-full w-full object-contain" />
              <div v-else class="flex flex-col items-center gap-1.5 text-slate-400">
                <i class="pi pi-camera text-2xl" />
                <span class="text-xs font-medium">Upload Foto</span>
              </div>
            </div>
            <button
              type="button"
              class="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-white shadow"
              @click="triggerPersonPhotoUpload"
              aria-label="Unggah foto"
            >
              <i class="pi pi-camera text-sm" />
            </button>
          </div>
        </div>

        <!-- Jabatan (dropdown) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Jabatan</label>
          <Select
            v-model="personForm.jabatan"
            :options="allJabatanOptions"
            optionLabel="label"
            optionValue="label"
            placeholder="Pilih jabatan"
            filter
            fluid
          />
        </div>

        <!-- Nama (input text) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Nama</label>
          <InputText v-model="personForm.nama" placeholder="Nama lengkap" fluid />
        </div>

        <!-- Deskripsi (input text) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Deskripsi</label>
          <InputText v-model="personForm.desc" placeholder="Deskripsi jabatan (opsional)" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text severity="secondary" @click="closePersonDialog" />
        <Button label="Save" icon="pi pi-check" @click="savePersonDialog" />
      </template>
    </Dialog>
  </div>
</template>
