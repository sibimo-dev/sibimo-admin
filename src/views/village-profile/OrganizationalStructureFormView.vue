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
import InputNumber from 'primevue/inputnumber'
import ToggleSwitch from 'primevue/toggleswitch'

import {
  getOrganizationalStructures,
  saveOrganizationalStructure,
} from '@/services/profile.service'
import { mediaUrl } from '@/services/media'

const toast = useToast()
const confirm = useConfirm()
const saving = ref(false)
const loading = ref(false)

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

// Foto lama berasal dari storage backend, sedangkan foto baru di modal masih
// berupa data URL. Keduanya harus bisa dipakai sebagai src di admin.
function photoSrc(value) {
  if (!value) return ''
  if (/^(data|blob):/i.test(String(value))) return value
  return mediaUrl(value)
}

/* Jabatan kustom yang pernah ditambahkan admin (di luar JABATAN_OPTIONS). */
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

/* form.people = satu-satunya sumber data tabel. */
const form = reactive({
  organizational_structure_id: null,
  title: 'Struktur Organisasi Pemerintah Kalurahan',
  status: 'Published',
  published_at: null,
  people: [],
  // Pejabat terdahulu (RT/RW hingga Lurah) + pengaturan tampil di halaman publik.
  former_officials: [],
  show_former_officials: false,
})

function seedCustomJabatan(existingLevels = []) {
  if (!Array.isArray(existingLevels)) return []

  const custom = []
  existingLevels.forEach((level) => {
    ;(level.people ?? []).forEach((person) => {
      const known = JABATAN_OPTIONS.some((option) => option.label === person.title)
      if (!known && person.title && !custom.some((item) => item.label === person.title)) {
        custom.push({
          label: person.title,
          level: level.level,
          pimpinan: !!level.pimpinan,
          slider: !!level.slider,
          centerOnDesktop: !!level.centerOnDesktop,
        })
      }
    })
  })

  return custom
}

function seedPeople(existingLevels = []) {
  if (!Array.isArray(existingLevels)) return []

  return existingLevels.flatMap((level) => (
    (level.people ?? []).map((person) => ({
      id: uid(),
      jabatan: person.title ?? null,
      nama: person.name ?? '',
      desc: person.desc ?? '',
      start_year: person.start_year ?? null,
      end_year: person.end_year ?? null,
      photo: person.photo ?? null,
      photoFile: null,
      signature: person.signature ?? null,
      signatureFile: null,
    }))
  ))
}

function seedFormerOfficials(list = []) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    id: item.id ?? uid(),
    jabatan: item.jabatan ?? '',
    nama: item.nama ?? '',
    start_year: item.start_year ?? null,
    end_year: item.end_year ?? null,
    desc: item.desc ?? '',
  }))
}

function loadExisting(structure) {
  if (!structure) return

  Object.assign(form, {
    organizational_structure_id: structure.organizational_structure_id,
    title: structure.title ?? 'Struktur Organisasi Pemerintah Kalurahan',
    status: structure.status ?? 'Published',
    published_at: structure.published_at ?? null,
    people: seedPeople(structure.levels ?? []),
    former_officials: seedFormerOfficials(structure.former_officials ?? []),
    show_former_officials: !!structure.show_former_officials,
  })
  customJabatan.splice(0, customJabatan.length, ...seedCustomJabatan(structure.levels ?? []))
}

onMounted(async () => {
  loading.value = true
  try {
    const structures = await getOrganizationalStructures()
    loadExisting(structures[0])
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: error.response?.data?.message ?? 'Gagal memuat struktur organisasi',
      life: 3000,
    })
  } finally {
    loading.value = false
  }
})

/* ========================================================================
   CRUD anggota struktur organisasi — daftar (DataTable) + modal (Dialog)
   Setiap perubahan dikirim sebagai satu payload struktur ke API.
   ======================================================================== */

const selectedPeople = ref([])

const personDialogVisible = ref(false)
const editingPersonId = ref(null)
const personDialogTitle = computed(() => (editingPersonId.value ? 'Edit Pamong' : 'Tambah Pamong'))

const emptyPersonForm = () => ({
  jabatan: null,
  nama: '',
  desc: '',
  start_year: null,
  end_year: null,
  photo: null,
  photoFile: null,
  signature: null,
  signatureFile: null,
})
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
    start_year: person.start_year ?? null,
    end_year: person.end_year ?? null,
    photo: person.photo,
    photoFile: null,
    signature: person.signature,
    signatureFile: null,
  })
  personDialogVisible.value = true
}

function closePersonDialog() {
  personDialogVisible.value = false
  editingPersonId.value = null
  Object.assign(personForm, emptyPersonForm())
}

function buildLevels() {
  const options = allJabatanOptions.value
  const order = []
  const levelMeta = new Map()

  options.forEach((option) => {
    if (!levelMeta.has(option.level)) {
      order.push(option.level)
      levelMeta.set(option.level, {
        pimpinan: false,
        slider: false,
        centerOnDesktop: false,
      })
    }

    const meta = levelMeta.get(option.level)
    meta.pimpinan ||= !!option.pimpinan
    meta.slider ||= !!option.slider
    meta.centerOnDesktop ||= !!option.centerOnDesktop
  })
  const buckets = new Map(order.map((level) => [level, []]))
  form.people.forEach((person) => {
    if (!person.jabatan || !person.nama.trim()) return

    const option = options.find((item) => item.label === person.jabatan)
    if (!option) return

    buckets.get(option.level).push({
      name: person.nama.trim(),
      title: person.jabatan,
      desc: person.desc?.trim() ?? '',
      start_year: person.start_year ?? null,
      end_year: person.end_year ?? null,
      photo: person.photoFile ? `upload:${person.id}` : person.photo,
      signature: person.signatureFile ? `upload-signature:${person.id}` : person.signature,
    })
  })

  return order
    .filter((level) => buckets.get(level)?.length)
    .map((level) => ({
      level,
      ...levelMeta.get(level),
      people: buckets.get(level),
    }))
}

async function persistStructure() {
  saving.value = true
  try {
    const files = form.people
      .flatMap((person) => [
        person.photoFile ? { token: person.id, file: person.photoFile } : null,
        person.signatureFile ? { token: person.id, file: person.signatureFile, type: 'signature' } : null,
      ].filter(Boolean))

    const saved = await saveOrganizationalStructure({
      id: form.organizational_structure_id,
      payload: {
        title: form.title,
        status: form.status,
        published_at: form.published_at,
        levels: buildLevels(),
        former_officials: form.former_officials.map((item) => ({
          id: item.id,
          jabatan: item.jabatan,
          nama: item.nama,
          start_year: item.start_year,
          end_year: item.end_year,
          desc: item.desc,
        })),
        show_former_officials: form.show_former_officials,
      },
      files,
    })

    loadExisting(saved)
    return true
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: error.response?.data?.message ?? 'Gagal menyimpan struktur organisasi',
      life: 3000,
    })
    return false
  } finally {
    saving.value = false
  }
}

async function savePersonDialog() {
  const nama = personForm.nama.trim()
  if (!personForm.jabatan || !nama) {
    toast.add({ severity: 'error', summary: 'Jabatan dan nama wajib diisi', life: 2500 })
    return
  }
  if (personForm.start_year && personForm.end_year && personForm.end_year < personForm.start_year) {
    toast.add({ severity: 'error', summary: 'Tahun selesai tidak boleh lebih kecil dari tahun mulai', life: 2500 })
    return
  }

  if (editingPersonId.value) {
    // photo/photoFile mengikuti isi modal apa adanya (sama seperti signature),
    // supaya foto yang dihapus di modal benar-benar terhapus saat disimpan.
    form.people = form.people.map((p) =>
      p.id === editingPersonId.value
        ? {
            ...p,
            jabatan: personForm.jabatan,
            nama,
            desc: personForm.desc.trim(),
            start_year: personForm.start_year,
            end_year: personForm.end_year,
            photo: personForm.photo,
            photoFile: personForm.photoFile,
            signature: personForm.signature,
            signatureFile: personForm.signatureFile,
          }
        : p
    )
  } else {
    form.people = [
      ...form.people,
      {
        id: uid(),
        jabatan: personForm.jabatan,
        nama,
        desc: personForm.desc.trim(),
        start_year: personForm.start_year,
        end_year: personForm.end_year,
        photo: personForm.photo,
        photoFile: personForm.photoFile,
        signature: personForm.signature,
        signatureFile: personForm.signatureFile,
      },
    ]
  }

  const saved = await persistStructure()
  if (!saved) return

  toast.add({
    severity: 'success',
    summary: editingPersonId.value ? 'Pamong diperbarui' : 'Pamong ditambahkan',
    life: 2500,
  })
  closePersonDialog()
}

function deletePerson(person) {
  confirm.require({
    message: `Hapus "${person.nama}" dari struktur organisasi?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      form.people = form.people.filter((p) => p.id !== person.id)
      selectedPeople.value = selectedPeople.value.filter((p) => p.id !== person.id)

      if (await persistStructure()) {
        toast.add({ severity: 'success', summary: 'Pamong dihapus', life: 2000 })
      }
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
    accept: async () => {
      const idsToRemove = new Set(selectedPeople.value.map((p) => p.id))
      form.people = form.people.filter((p) => !idsToRemove.has(p.id))
      selectedPeople.value = []

      if (await persistStructure()) {
        toast.add({ severity: 'success', summary: 'Pamong terpilih dihapus', life: 2000 })
      }
    },
  })
}

/* ---- Unggah foto (dipakai di dalam modal) ---- */
const personPhotoInput = ref(null)

function triggerPersonPhotoUpload() {
  personPhotoInput.value?.click()
}

function removePersonPhoto() {
  personForm.photo = null
  personForm.photoFile = null
}

function onPersonPhotoChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.add({ severity: 'error', summary: 'File foto harus berupa gambar', life: 2500 })
    return
  }

  const reader = new FileReader()
  reader.onload = () => {
    personForm.photo = reader.result
    personForm.photoFile = file
  }
  reader.readAsDataURL(file)
}

const personSignatureInput = ref(null)

function triggerPersonSignatureUpload() {
  personSignatureInput.value?.click()
}

function removePersonSignature() {
  personForm.signature = null
  personForm.signatureFile = null
}

function compressSignature(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 220
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)
        const scale = Math.min((canvas.width - 40) / image.width, (canvas.height - 40) / image.height)
        const width = image.width * scale
        const height = image.height * scale
        context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('Gagal mengompres tanda tangan.'))
          resolve(new File([blob], 'signature.png', { type: 'image/png' }))
        }, 'image/png')
      }
      image.onerror = reject
      image.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onPersonSignatureChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.add({ severity: 'error', summary: 'File tanda tangan harus berupa gambar', life: 2500 })
    return
  }

  try {
    const compressed = await compressSignature(file)
    const reader = new FileReader()
    reader.onload = () => {
      personForm.signature = reader.result
      personForm.signatureFile = compressed
    }
    reader.readAsDataURL(compressed)
  } catch {
    toast.add({ severity: 'error', summary: 'Gagal memproses tanda tangan', life: 2500 })
  }
}

/* ========================================================================
   CRUD pejabat terdahulu (RT/RW hingga Lurah) + toggle tampil di publik.
   Disimpan bersama payload struktur yang sama (persistStructure).
   ======================================================================== */

const FORMER_EXTRA_JABATAN = ['RT', 'RW']
const formerJabatanOptions = computed(() => {
  const seen = new Set()
  const list = []
  ;[...FORMER_EXTRA_JABATAN, ...allJabatanOptions.value.map((o) => o.label)].forEach((label) => {
    if (!seen.has(label)) {
      seen.add(label)
      list.push(label)
    }
  })
  return list
})

function formatMasaJabatan(item) {
  if (!item?.start_year && !item?.end_year) return '—'
  if (item.start_year && !item.end_year) return `${item.start_year} – Sekarang`
  return `${item.start_year ?? '?'} – ${item.end_year}`
}

const selectedFormer = ref([])
const formerDialogVisible = ref(false)
const editingFormerId = ref(null)
const formerDialogTitle = computed(() =>
  editingFormerId.value ? 'Edit Pejabat Terdahulu' : 'Tambah Pejabat Terdahulu',
)

const emptyFormerForm = () => ({ jabatan: null, nama: '', start_year: null, end_year: null, desc: '' })
const formerForm = reactive(emptyFormerForm())
const formerNomor = ref('')
const needsNomor = computed(() =>
  ['RT', 'RW'].includes((formerForm.jabatan || '').trim().toUpperCase()),
)

function openNewFormer() {
  editingFormerId.value = null
  Object.assign(formerForm, emptyFormerForm())
  formerDialogVisible.value = true
  formerNomor.value = ''
}

function openEditFormer(item) {
  editingFormerId.value = item.id
  const match = /^(RT|RW)\s+(.+)$/i.exec(item.jabatan || '')
  Object.assign(formerForm, {
    jabatan: match ? match[1].toUpperCase() : item.jabatan,
    nama: item.nama,
    start_year: item.start_year,
    end_year: item.end_year,
    desc: item.desc,
  })
  formerNomor.value = match ? match[2] : ''
  formerDialogVisible.value = true
}

function closeFormerDialog() {
  formerDialogVisible.value = false
  editingFormerId.value = null
  Object.assign(formerForm, emptyFormerForm())
  formerNomor.value = ''
}

async function saveFormerDialog() {
  let jabatan = (formerForm.jabatan || '').trim()
  if (needsNomor.value && formerNomor.value.trim()) {
    jabatan = `${jabatan} ${formerNomor.value.trim()}`
  }  
  const nama = formerForm.nama.trim()
  if (!jabatan || !nama) {
    toast.add({ severity: 'error', summary: 'Jabatan dan nama wajib diisi', life: 2500 })
    return
  }
  if (!formerForm.start_year || !formerForm.end_year) {
    toast.add({ severity: 'error', summary: 'Masa jabatan (tahun mulai & selesai) wajib diisi', life: 2500 })
    return
  }
  if (formerForm.end_year < formerForm.start_year) {
    toast.add({ severity: 'error', summary: 'Tahun selesai tidak boleh lebih kecil dari tahun mulai', life: 2500 })
    return
  }

  const entry = {
    jabatan,
    nama,
    start_year: formerForm.start_year,
    end_year: formerForm.end_year,
    desc: formerForm.desc.trim(),
  }

  const wasEditing = !!editingFormerId.value
  if (wasEditing) {
    form.former_officials = form.former_officials.map((p) =>
      p.id === editingFormerId.value ? { ...p, ...entry } : p,
    )
  } else {
    form.former_officials = [...form.former_officials, { id: uid(), ...entry }]
  }

  if (!(await persistStructure())) return

  toast.add({
    severity: 'success',
    summary: wasEditing ? 'Pejabat terdahulu diperbarui' : 'Pejabat terdahulu ditambahkan',
    life: 2500,
  })
  closeFormerDialog()
}

function deleteFormer(item) {
  confirm.require({
    message: `Hapus "${item.nama}" dari daftar pejabat terdahulu?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      form.former_officials = form.former_officials.filter((p) => p.id !== item.id)
      selectedFormer.value = selectedFormer.value.filter((p) => p.id !== item.id)
      if (await persistStructure()) {
        toast.add({ severity: 'success', summary: 'Pejabat terdahulu dihapus', life: 2000 })
      }
    },
  })
}

function deleteSelectedFormer() {
  if (!selectedFormer.value.length) return
  confirm.require({
    message: `Hapus ${selectedFormer.value.length} pejabat terdahulu terpilih?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const ids = new Set(selectedFormer.value.map((p) => p.id))
      form.former_officials = form.former_officials.filter((p) => !ids.has(p.id))
      selectedFormer.value = []
      if (await persistStructure()) {
        toast.add({ severity: 'success', summary: 'Pejabat terdahulu terpilih dihapus', life: 2000 })
      }
    },
  })
}

// Toggle tampil di halaman publik: langsung disimpan, dikembalikan jika gagal.
async function onToggleShowFormer(value) {
  const previous = !value
  form.show_former_officials = value
  if (await persistStructure()) {
    toast.add({
      severity: 'success',
      summary: value
        ? 'Pejabat terdahulu akan ditampilkan di halaman profil'
        : 'Pejabat terdahulu disembunyikan dari halaman profil',
      life: 2500,
    })
  } else {
    form.show_former_officials = previous
  }
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
          :value="form.people"
          :loading="loading"
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
                :image="photoSrc(data.photo) || undefined"
                :label="!photoSrc(data.photo) ? initials(data.nama) : undefined"
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

          <Column field="start_year" header="Masa Jabatan">
            <template #body="{ data }">
              <span class="whitespace-nowrap text-slate-600">{{ formatMasaJabatan(data) }}</span>
            </template>
          </Column>

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

    <!-- ===== Pejabat Terdahulu ===== -->
    <Card class="mt-6">
      <template #title>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm font-semibold text-slate-700">Pejabat Terdahulu</span>
          <div class="flex items-center gap-2">
            <ToggleSwitch
              inputId="showFormer"
              :modelValue="form.show_former_officials"
              :disabled="saving || loading"
              @update:modelValue="onToggleShowFormer"
            />
            <label for="showFormer" class="cursor-pointer text-xs font-medium text-slate-600">
              Tampilkan di halaman profil publik
            </label>
          </div>
        </div>
      </template>
      <template #content>
        <div class="mb-3 flex items-center gap-2">
          <Button label="Tambah Pejabat" icon="pi pi-plus" size="small" @click="openNewFormer" />
          <Button
            label="Hapus"
            icon="pi pi-trash"
            size="small"
            severity="danger"
            outlined
            :disabled="!selectedFormer.length"
            @click="deleteSelectedFormer"
          />
        </div>

        <DataTable
          v-model:selection="selectedFormer"
          :value="form.former_officials"
          :loading="loading"
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
              Belum ada data pejabat terdahulu. Klik "Tambah Pejabat" untuk mulai.
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column field="jabatan" header="Jabatan" sortable />
          <Column field="nama" header="Nama" sortable />
          <Column field="start_year" header="Masa Jabatan" sortable>
            <template #body="{ data }">{{ formatMasaJabatan(data) }}</template>
          </Column>
          <Column field="desc" header="Keterangan">
            <template #body="{ data }">
              <span class="line-clamp-1 text-slate-500">{{ data.desc || '—' }}</span>
            </template>
          </Column>
          <Column header="Aksi" headerStyle="width: 6rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button icon="pi pi-pencil" text rounded size="small" @click="openEditFormer(data)" aria-label="Edit pejabat terdahulu" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deleteFormer(data)" aria-label="Hapus pejabat terdahulu" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modal Tambah / Edit Pejabat Terdahulu -->
    <Dialog
      v-model:visible="formerDialogVisible"
      modal
      :header="formerDialogTitle"
      :style="{ width: '440px' }"
      :closable="true"
      @hide="closeFormerDialog"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Jabatan</label>
          <Select
            v-model="formerForm.jabatan"
            :options="formerJabatanOptions"
            editable
            filter
            placeholder="Pilih atau ketik jabatan (mis. RT 03 / RW 02)"
            fluid
          />
          <div v-if="needsNomor" class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Nomor {{ formerForm.jabatan }}</label>
            <InputText v-model="formerNomor" placeholder="mis. 03" fluid />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Nama</label>
          <InputText v-model="formerForm.nama" placeholder="Nama lengkap" fluid />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Tahun Mulai</label>
            <InputNumber v-model="formerForm.start_year" :useGrouping="false" :min="1900" :max="2100" placeholder="mis. 2010" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Tahun Selesai</label>
            <InputNumber v-model="formerForm.end_year" :useGrouping="false" :min="1900" :max="2100" placeholder="mis. 2018" fluid />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Keterangan</label>
          <InputText v-model="formerForm.desc" placeholder="Opsional" fluid />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text severity="secondary" :disabled="saving" @click="closeFormerDialog" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="saveFormerDialog" />
      </template>
    </Dialog>

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
      <input ref="personSignatureInput" type="file" accept="image/*" class="hidden" @change="onPersonSignatureChange" />

      <div class="flex flex-col gap-4">
        <!-- Upload foto: preview besar + tombol Upload/Ganti & Hapus (sama pola dengan tanda tangan) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Foto</label>
          <div class="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <div
              class="flex h-44 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded bg-white hover:ring-1 hover:ring-blue-400"
              @click="triggerPersonPhotoUpload"
            >
              <img v-if="personForm.photo" :src="photoSrc(personForm.photo)" alt="Foto pamong" class="h-full w-full object-contain" />
              <div v-else class="flex flex-col items-center gap-1.5 text-slate-400">
                <i class="pi pi-camera text-2xl" />
                <span class="text-xs font-medium">Belum ada foto</span>
              </div>
            </div>
            <div class="flex shrink-0 flex-col gap-1.5">
              <Button
                :label="personForm.photo ? 'Ganti' : 'Upload'"
                icon="pi pi-upload"
                size="small"
                outlined
                @click="triggerPersonPhotoUpload"
              />
              <Button v-if="personForm.photo" label="Hapus" icon="pi pi-trash" size="small" text severity="danger" @click="removePersonPhoto" />
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Tanda Tangan Digital</label>
          <div class="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
            <div class="flex h-20 flex-1 items-center justify-center overflow-hidden rounded bg-white">
              <img v-if="personForm.signature" :src="photoSrc(personForm.signature)" alt="Tanda tangan digital" class="h-full w-full object-contain" />
              <span v-else class="text-xs text-slate-400">Belum ada tanda tangan</span>
            </div>
            <div class="flex shrink-0 flex-col gap-1.5">
              <Button label="Upload" icon="pi pi-upload" size="small" outlined @click="triggerPersonSignatureUpload" />
              <Button v-if="personForm.signature" label="Hapus" icon="pi pi-trash" size="small" text severity="danger" @click="removePersonSignature" />
            </div>
          </div>
          <small class="text-xs text-slate-400">Otomatis dinormalisasi ke PNG transparan 600 × 220 px.</small>
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

        <!-- Masa jabatan -->
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Masa Jabatan</label>
          <div class="grid grid-cols-2 gap-3">
            <InputNumber v-model="personForm.start_year" :useGrouping="false" :min="1900" :max="2100" placeholder="Tahun mulai" fluid />
            <InputNumber v-model="personForm.end_year" :useGrouping="false" :min="1900" :max="2100" placeholder="Tahun selesai" fluid />
          </div>
          <small class="text-xs text-slate-400">Kosongkan tahun selesai jika masih menjabat (tampil "Sekarang").</small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text severity="secondary" :disabled="saving" @click="closePersonDialog" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="savePersonDialog" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* PrimeVue Avatar tidak set object-fit secara default, jadi foto lonjong
   ikut memepet/gepeng mengikuti bentuk lingkaran. Paksa object-fit: cover
   supaya rasio foto tetap terjaga di thumbnail tabel. */
:deep(.p-avatar img) {
  object-fit: cover;
}
</style>
