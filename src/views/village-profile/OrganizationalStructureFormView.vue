<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Avatar from 'primevue/avatar'

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

/* ---- Form tambah jabatan baru ---- */
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
  form.people.forEach((p) => {
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

/* ---- Simpan ---- */
async function persist(nextStatus) {
  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }
  const incomplete = form.people.some((p) => (p.jabatan && !p.nama.trim()) || (!p.jabatan && p.nama.trim()))
  if (incomplete) {
    toast.add({ severity: 'error', summary: 'Lengkapi jabatan dan nama pada setiap baris', life: 2500 })
    return
  }

  form.status = nextStatus
  saving.value = true
  try {
    if (form.status === 'Published' && !form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 10)
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

    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
  } finally {
    saving.value = false
  }
}

function saveDraft() {
  persist('Draft')
}
function saveMain() {
  persist(isEdit.value ? form.status : 'Published')
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <input ref="globalFileInput" type="file" accept="image/*" class="hidden" @change="onGlobalFileChange" />

    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">{{ pageTitle }}</h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div class="flex flex-col gap-5">
        <Card>
          <template #content>
            <div class="flex flex-col gap-2">
              <label for="title" class="text-[13px] font-semibold text-slate-700">Judul</label>
              <InputText id="title" v-model="form.title" placeholder="Judul" fluid />
            </div>
          </template>
        </Card>

        <Card>
          <template #title>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-slate-700">Struktur Organisasi</span>
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
            <!-- Form tambah jabatan baru -->
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

            <div class="flex flex-col gap-2.5">
              <div
                v-for="person in form.people"
                :key="person.id"
                class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3"
              >
                <div class="relative flex-none">
                  <Avatar
                    :image="person.photo || undefined"
                    :label="!person.photo ? initials(person.nama) : undefined"
                    shape="circle"
                    size="large"
                    class="!bg-blue-100 !text-blue-700"
                  />
                  <button
                    type="button"
                    class="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white shadow"
                    @click="triggerPersonPhoto(person.id)"
                    aria-label="Unggah foto"
                  >
                    <i class="pi pi-camera text-[10px]" />
                  </button>
                </div>

                <div class="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select
                    v-model="person.jabatan"
                    :options="allJabatanOptions"
                    optionLabel="label"
                    optionValue="label"
                    placeholder="Pilih jabatan"
                    filter
                    size="small"
                  />
                  <InputText v-model="person.nama" placeholder="Nama lengkap" size="small" />
                  <InputText v-model="person.desc" placeholder="Deskripsi jabatan (opsional)" size="small" class="sm:col-span-2" />
                </div>

                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="removePerson(person.id)" aria-label="Hapus baris" />
              </div>

              <Button label="Tambah Orang" icon="pi pi-user-plus" outlined size="small" class="self-start" @click="addPerson" />
            </div>
          </template>
        </Card>
      </div>

      <aside class="flex flex-col gap-3.5">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button label="Simpan Draft" severity="secondary" outlined class="flex-1" :loading="saving" @click="saveDraft" />
              <Button :label="mainButtonLabel" class="flex-1" :loading="saving" @click="saveMain" />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <button type="button" class="flex items-center justify-between text-left text-[13px] text-slate-700" @click="statusOpen = !statusOpen">
                <span>Status: <strong>{{ statusDisplay }}</strong></span>
                <i class="pi pi-chevron-down text-xs text-slate-400 transition-transform" :class="{ 'rotate-180': statusOpen }" />
              </button>
              <Select v-show="statusOpen" v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" fluid />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>
