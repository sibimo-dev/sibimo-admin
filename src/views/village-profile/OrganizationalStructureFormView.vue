<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
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

/* Daftar jabatan bawaan, sesuai struktur yang ditampilkan di halaman publik. */
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
  { label: 'Ketua RT', level: 'Ketua RT & Ketua RW', slider: true },
  { label: 'Ketua RW', level: 'Ketua RT & Ketua RW', slider: true },
]

/* Jabatan yang bisa dipilih lewat "Tambah Staff". */
const JABATAN_STAFF = 'Staff Pamong Kalurahan'
const JABATAN_KETUA_RT = 'Ketua RT'
const JABATAN_KETUA_RW = 'Ketua RW'
const JABATAN_DUKUH = 'Dukuh'
const DUKUH_LEVEL = 'Dukuh (Kepala Padukuhan)'
const ADD_STAFF_JABATAN = [JABATAN_STAFF, JABATAN_KETUA_RT, JABATAN_KETUA_RW, JABATAN_DUKUH]

/* Dukuh disimpan sebagai satu jabatan berformat "Dukuh <nomor urut> <nama padukuhan>",
   mis. "Dukuh I Krebet". Format ini sama dengan data lama, sehingga padukuhan baru
   (pemekaran dusun) tidak perlu didaftarkan di kode: cukup isi nomor urut & namanya. */
function isDukuhLabel(label) {
  return /^Dukuh(\s|$)/i.test(String(label ?? '').trim())
}

function parseDukuhLabel(label) {
  const rest = String(label ?? '').trim().replace(/^Dukuh\s*/i, '')
  const match = rest.match(/^([IVXLCDM]+|\d+)\s+(.+)$/)
  return match ? { number: match[1], name: match[2].trim() } : { number: '', name: rest }
}

function composeDukuhLabel(number, name) {
  return ['Dukuh', String(number ?? '').trim().toUpperCase(), String(name ?? '').trim()]
    .filter(Boolean)
    .join(' ')
}

const GENDER_OPTIONS = ['LAKI-LAKI', 'PEREMPUAN']
const EDUCATION_OPTIONS = [
  'SD/Sederajat',
  'SLTP/Sederajat',
  'SLTA/Sederajat',
  'D-I/Sederajat',
  'D-II/Sederajat',
  'D-III/Sederajat',
  'D-IV/S-1/Sederajat',
  'S-2/Sederajat',
  'S-3/Sederajat',
]

// Jenjang perkuliahan (D-I s.d. S-3) memakai "Nama Instansi Pendidikan"; jenjang sekolah (SD/SLTP/SLTA) memakai "Nama Sekolah".
function isHigherEducation(level) {
  return /^[DS]-/i.test(String(level ?? '').trim())
}

const SK_MAX_SIZE_MB = 5
const SK_ACCEPT = '.pdf,.doc,.docx,image/*'

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

// Data lama kadang tertulis "Staf Pamong Kalurahan" (satu f). Samakan ke bentuk baku
// "Staff Pamong Kalurahan" supaya tidak muncul sebagai dua jabatan berbeda.
function canonicalStaff(value) {
  return String(value ?? '').replace(/^\s*Staf(?=\s)/i, 'Staff')
}

// "Lurah Kalurahan Bimomartani" -> "Lurah"
function normalizeJabatan(title) {
  return canonicalStaff(
    String(title ?? '').replace(/\s+Kalurahan\s+Bimomartani\s*$/i, '').trim(),
  )
}

// Kunci pembanding jabatan: abaikan huruf besar/kecil, spasi ganda, spasi tak terlihat
// (mis. non-breaking space), dan ejaan "Staf"/"Staff", supaya "Staff Pamong Kalurahan"
// tidak muncul dua kali.
function jabatanKey(value) {
  return canonicalStaff(
    String(value ?? '').replace(/[\s\u00A0\u200B]+/g, ' ').trim(),
  ).toLowerCase()
}

/* Jabatan yang sudah ada di data tersimpan tetapi tidak ada di JABATAN_OPTIONS.
   Tidak ada form untuk menambah jabatan baru; daftar ini hanya dipakai
   supaya data lama tidak hilang saat disimpan ulang. */
const customJabatan = reactive([])

// Gabungan jabatan bawaan + jabatan khusus, tanpa duplikat.
const allJabatanOptions = computed(() => {
  const seen = new Set()
  return [...JABATAN_OPTIONS, ...customJabatan].filter((option) => {
    const key = jabatanKey(option.label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
})

/* form.people = satu-satunya sumber data tabel. */
const form = reactive({
  organizational_structure_id: null,
  title: 'Struktur Organisasi Pemerintah Kalurahan',
  status: 'Published',
  published_at: null,
  people: [],
  former_officials: [],
  show_former_officials: false,
})

function seedCustomJabatan(existingLevels = []) {
  if (!Array.isArray(existingLevels)) return []

  const knownKeys = new Set(JABATAN_OPTIONS.map((option) => jabatanKey(option.label)))
  const custom = []
  existingLevels.forEach((level) => {
    ;(level.people ?? []).forEach((person) => {
      const title = normalizeJabatan(person.title)
      const key = jabatanKey(title)
      if (!key || knownKeys.has(key)) return
      knownKeys.add(key)
      custom.push({
        label: title,
        level: level.level,
        pimpinan: !!level.pimpinan,
        slider: !!level.slider,
        centerOnDesktop: !!level.centerOnDesktop,
      })
    })
  })

  return custom
}

/* Riwayat jabatan: sk (judul/nomor SK), date, official, serta dokumen opsional.
   - document      : path file yang sudah tersimpan di backend
   - document_name : nama file asli (ditampilkan)
   - documentFile  : File baru yang belum diunggah */
function seedHistory(list = []) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    sk: item?.sk ?? '',
    date: item?.date ?? '',
    official: item?.official ?? '',
    document: item?.document ?? null,
    document_name:
      item?.document_name ??
      (item?.document ? String(item.document).split('/').pop() : ''),
    documentFile: item?.documentFile ?? null,
  }))
}

// Riwayat jabatan pejabat terdahulu: hanya teks (tanpa unggah dokumen).
function seedFormerHistory(list = []) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    sk: item?.sk ?? '',
    date: item?.date ?? '',
    official: item?.official ?? '',
  }))
}

function seedPeople(existingLevels = []) {
  if (!Array.isArray(existingLevels)) return []

  return existingLevels.flatMap((level) => (
    (level.people ?? []).map((person) => ({
      id: uid(),
      staff_id: person.staff_id ?? null,
      jabatan: normalizeJabatan(person.title) || null,
      nama: person.name ?? '',
      desc: person.desc ?? '',
      gender: person.gender ?? null,
      education: person.education ?? null,
      major: person.major ?? '',
      school_name: person.school_name ?? '',
      graduation_year: person.graduation_year ?? null,
      birth_date: person.birth_date ?? '',
      term_end_date: person.term_end_date ?? '',
      position_history: seedHistory(person.position_history),
      start_date: person.start_date ?? '',
      end_date: person.end_date ?? '',
      // start_year / end_year = data lama (hanya tahun), dipertahankan agar tidak hilang.
      start_year: person.start_year ?? null,
      end_year: person.end_year ?? null,
      photo: person.photo ?? null,
      photoFile: null,
      signature: person.signature ?? null,
      signatureFile: null,
      // Khusus Ketua RT / Ketua RW
      rt_number: person.rt_number ?? '',
      rw_number: person.rw_number ?? '',
      padukuhan: person.padukuhan ?? '',
      // SK utama
      sk_number: person.sk_number ?? '',
      sk_document: person.sk_document ?? null,
      sk_document_name:
        person.sk_document_name ??
        (person.sk_document ? String(person.sk_document).split('/').pop() : ''),
      skFile: null,
    }))
  ))
}

function seedFormerOfficials(list = []) {
  if (!Array.isArray(list)) return []
  return list.map((item) => ({
    id: item.id ?? uid(),
    staff_id: item.staff_id ?? null,
    jabatan: canonicalStaff(item.jabatan ?? ''),
    nama: item.nama ?? '',
    rt_number: item.rt_number ?? '',
    rw_number: item.rw_number ?? '',
    padukuhan: item.padukuhan ?? '',
    start_year: item.start_year ?? null,
    end_year: item.end_year ?? null,
    start_date: item.start_date ?? '',
    end_date: item.end_date ?? '',
    desc: item.desc ?? '',
    gender: item.gender ?? null,
    birth_date: item.birth_date ?? '',
    education: item.education ?? null,
    major: item.major ?? '',
    school_name: item.school_name ?? '',
    graduation_year: item.graduation_year ?? null,
    sk_number: item.sk_number ?? '',
    position_history: seedFormerHistory(item.position_history),
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
const personDialogTitle = computed(() => (editingPersonId.value ? 'Edit Data Pamong' : 'Tambah Staff'))

// Tambah: Staff Pamong Kalurahan, Ketua RT, Ketua RW.
// Edit: semua jabatan.
const jabatanDropdownOptions = computed(() => {
  if (!editingPersonId.value) {
    return ADD_STAFF_JABATAN.map((label) => ({ label }))
  }
  const labels = allJabatanOptions.value
    .map((option) => option.label)
    .filter((label) => !isDukuhLabel(label))
  return [...labels, JABATAN_DUKUH].map((label) => ({ label }))
})

const emptyPersonForm = () => ({
  jabatan: null,
  nama: '',
  desc: '',
  gender: null,
  education: null,
  major: '',
  school_name: '',
  graduation_year: null,
  birth_date: '',
  term_end_date: '',
  position_history: [],
  start_date: '',
  end_date: '',
  start_year: null,
  end_year: null,
  photo: null,
  photoFile: null,
  signature: null,
  signatureFile: null,
  rt_number: '',
  rw_number: '',
  padukuhan: '',
  dukuh_number: '',
  sk_number: '',
  sk_document: null,
  sk_document_name: '',
  skFile: null,
})
const personForm = reactive(emptyPersonForm())

/* Deteksi perubahan form: klik di luar modal / Escape hanya menutup modal
   jika belum ada isian yang diubah dibanding kondisi saat modal dibuka. */
const personSnapshot = ref('')

function serializePersonForm() {
  return JSON.stringify(personForm, (_key, value) => (
    value instanceof File ? `file:${value.name}:${value.size}:${value.lastModified}` : value
  ))
}

const isPersonFormDirty = computed(() => (
  personDialogVisible.value
  && personSnapshot.value !== ''
  && serializePersonForm() !== personSnapshot.value
))

const schoolNameLabel = computed(() => (
  isHigherEducation(personForm.education) ? 'Nama Instansi Pendidikan' : 'Nama Sekolah'
))
const schoolNamePlaceholder = computed(() => (
  isHigherEducation(personForm.education) ? 'mis. Universitas Negeri Yogyakarta' : 'mis. SMA Negeri 1 Yogyakarta'
))

const isKetuaRt = computed(() => personForm.jabatan === JABATAN_KETUA_RT)
const isKetuaRw = computed(() => personForm.jabatan === JABATAN_KETUA_RW)
const isRtRw = computed(() => isKetuaRt.value || isKetuaRw.value)
const isDukuh = computed(() => personForm.jabatan === JABATAN_DUKUH)

// Ketua RT/RW: tanpa foto & tanda tangan (di publik hanya data teks).
// Dukuh: foto saja (tampil di hierarki). Staff Pamong & lainnya: foto + tanda tangan.
const showPhoto = computed(() => !isRtRw.value)
const showSignature = computed(() => !isRtRw.value && !isDukuh.value)

// Contoh hasil: "Dukuh XIII Krebet Baru".
const dukuhLabelPreview = computed(() => composeDukuhLabel(personForm.dukuh_number, personForm.padukuhan))

// Bersihkan isian yang tidak relevan saat jabatan berganti.
watch(
  () => personForm.jabatan,
  (jabatan) => {
    const rt = jabatan === JABATAN_KETUA_RT
    const rw = jabatan === JABATAN_KETUA_RW
    const dukuh = jabatan === JABATAN_DUKUH
    if (!rt) personForm.rt_number = ''
    if (!rt && !rw) personForm.rw_number = ''
    if (!rt && !rw && !dukuh) personForm.padukuhan = ''
    if (!dukuh) personForm.dukuh_number = ''
  },
)

/* ---- Preview detail pamong / pejabat terdahulu (pop up, hanya baca) ---- */
const previewDialogVisible = ref(false)
const previewPerson = ref(null)
// 'person' = Daftar Pamong Kalurahan, 'former' = Pejabat Terdahulu
const previewKind = ref('person')

function openPreview(person) {
  previewKind.value = 'person'
  previewPerson.value = person
  previewDialogVisible.value = true
}

function openPreviewFormer(item) {
  previewKind.value = 'former'
  previewPerson.value = item
  previewDialogVisible.value = true
}

function closePreview() {
  previewDialogVisible.value = false
  previewPerson.value = null
}

function editFromPreview() {
  const person = previewPerson.value
  const kind = previewKind.value
  closePreview()
  if (!person) return
  if (kind === 'former') openEditFormer(person)
  else openEditPerson(person)
}

const previewIsRtRw = computed(() => {
  const jabatan = previewPerson.value?.jabatan
  return jabatan === JABATAN_KETUA_RT || jabatan === JABATAN_KETUA_RW
})

// Jabatan lengkap untuk chip, mis. "LURAH KALURAHAN BIMOMARTANI".
const previewJabatanFull = computed(() => {
  const label = formatJabatanFormer(previewPerson.value)
  return label ? `${label} Kalurahan Bimomartani` : ''
})

// Kartu "Informasi Pamong": selalu tampil, nilai kosong ditulis "—" (sama seperti halaman publik).
const previewInfoCards = computed(() => {
  const p = previewPerson.value
  if (!p) return []

  const masaJabatan = formatMasaJabatan(p)
  const common = [
    { label: 'Jenis Kelamin', value: p.gender, icon: 'pi-user' },
    { label: 'Usia', value: calcAge(p.birth_date) !== null ? `${calcAge(p.birth_date)} tahun` : '', icon: 'pi-id-card' },
  ]

  // Kartu wilayah: RT/RW (nomor & padukuhan) atau Dukuh (padukuhan).
  const region = previewIsRtRw.value
    ? [
        ...(p.jabatan === JABATAN_KETUA_RT
          ? [{ label: 'Nomor RT', value: padNumber(p.rt_number), icon: 'pi-hashtag' }]
          : []),
        { label: 'Nomor RW', value: padNumber(p.rw_number), icon: 'pi-hashtag' },
        { label: 'Padukuhan', value: p.padukuhan, icon: 'pi-map-marker' },
      ]
    : isDukuhLabel(p.jabatan)
      ? [{ label: 'Padukuhan', value: p.padukuhan || parseDukuhLabel(p.jabatan).name, icon: 'pi-map-marker' }]
      : []

  const education = [
    { label: 'Jenjang Pendidikan', value: p.education, icon: 'pi-book' },
    { label: 'Jurusan', value: p.major, icon: 'pi-bookmark' },
    {
      label: isHigherEducation(p.education) ? 'Nama Instansi Pendidikan' : 'Nama Sekolah',
      value: p.school_name,
      icon: 'pi-building',
    },
    { label: 'Tahun Lulus', value: p.graduation_year, icon: 'pi-graduation-cap' },
  ]

  const middle = [...region, ...education]

  return [
    ...common,
    ...middle,
    { label: 'Masa Jabatan', value: masaJabatan === '—' ? '' : masaJabatan, icon: 'pi-calendar' },
  ]
})

function openNewPerson() {
  editingPersonId.value = null
  Object.assign(personForm, emptyPersonForm(), { jabatan: JABATAN_STAFF })
  personSnapshot.value = serializePersonForm()
  personDialogVisible.value = true
}

function openEditPerson(person) {
  editingPersonId.value = person.id
  Object.assign(personForm, {
    jabatan: isDukuhLabel(person.jabatan) ? JABATAN_DUKUH : person.jabatan,
    dukuh_number: isDukuhLabel(person.jabatan) ? parseDukuhLabel(person.jabatan).number : '',
    nama: person.nama,
    desc: person.desc,
    gender: person.gender ?? null,
    education: person.education ?? null,
    major: person.major ?? '',
    school_name: person.school_name ?? '',
    graduation_year: person.graduation_year ?? null,
    birth_date: person.birth_date ?? '',
    term_end_date: person.term_end_date ?? '',
    position_history: seedHistory(person.position_history),
    start_date: person.start_date ?? '',
    end_date: person.end_date ?? '',
    start_year: person.start_year ?? null,
    end_year: person.end_year ?? null,
    photo: person.photo,
    photoFile: null,
    signature: person.signature,
    signatureFile: null,
    rt_number: person.rt_number ?? '',
    rw_number: person.rw_number ?? '',
    padukuhan: person.padukuhan || (isDukuhLabel(person.jabatan) ? parseDukuhLabel(person.jabatan).name : ''),
    sk_number: person.sk_number ?? '',
    sk_document: person.sk_document ?? null,
    sk_document_name: person.sk_document_name ?? '',
    skFile: null,
  })
  personSnapshot.value = serializePersonForm()
  personDialogVisible.value = true
}

function closePersonDialog() {
  personDialogVisible.value = false
  personSnapshot.value = ''
  editingPersonId.value = null
  Object.assign(personForm, emptyPersonForm())
}

/* ---- Riwayat jabatan (SK, tanggal, pejabat, dokumen opsional) ---- */
function addHistoryRow() {
  personForm.position_history.push({
    sk: '',
    date: '',
    official: '',
    document: null,
    document_name: '',
    documentFile: null,
  })
}

function removeHistoryRow(index) {
  personForm.position_history.splice(index, 1)
}

function hasSkDocument(item) {
  return !!(item?.documentFile || item?.document)
}

const skFileInput = ref(null)
let skTargetIndex = null

function triggerSkUpload(index) {
  skTargetIndex = index
  skFileInput.value?.click()
}

// Jika dokumen diunggah, judul SK otomatis diambil dari nama file (tanpa ekstensi).
function onSkFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (file.size > SK_MAX_SIZE_MB * 1024 * 1024) {
    toast.add({ severity: 'error', summary: `Ukuran dokumen maksimal ${SK_MAX_SIZE_MB} MB`, life: 2500 })
    return
  }

  const item = personForm.position_history[skTargetIndex]
  if (!item) return

  item.documentFile = file
  item.document_name = file.name
  item.sk = file.name.replace(/\.[^.]+$/, '')
}

function removeSkDocument(index) {
  const item = personForm.position_history[index]
  if (!item) return
  item.documentFile = null
  item.document = null
  item.document_name = ''
  item.sk = ''
}

/* ---- SK utama (nomor SK + dokumen) ---- */
const mainSkInput = ref(null)

function triggerMainSkUpload() {
  mainSkInput.value?.click()
}

function onMainSkChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  if (file.size > SK_MAX_SIZE_MB * 1024 * 1024) {
    toast.add({ severity: 'error', summary: `Ukuran dokumen maksimal ${SK_MAX_SIZE_MB} MB`, life: 2500 })
    return
  }

  personForm.skFile = file
  personForm.sk_document_name = file.name
  if (!personForm.sk_number.trim()) {
    personForm.sk_number = file.name.replace(/\.[^.]+$/, '')
  }
}

function removeMainSk() {
  personForm.skFile = null
  personForm.sk_document = null
  personForm.sk_document_name = ''
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

    const personKey = jabatanKey(person.jabatan)
    const option =
      options.find((item) => jabatanKey(item.label) === personKey) ??
      (isDukuhLabel(person.jabatan) ? options.find((item) => item.level === DUKUH_LEVEL) : null)
    if (!option) return

    buckets.get(option.level).push({
      staff_id: person.staff_id ?? null,
      name: person.nama.trim(),
      title: person.jabatan,
      desc: person.desc?.trim() ?? '',
      gender: person.gender ?? null,
      education: person.education ?? null,
      major: person.major?.trim() ?? '',
      school_name: person.school_name?.trim() ?? '',
      graduation_year: person.graduation_year ?? null,
      birth_date: person.birth_date ?? '',
      term_end_date: person.term_end_date || null,
      position_history: (person.position_history ?? []).map((item, index) => ({
        sk: item.sk,
        date: item.date,
        official: item.official,
        // File baru ditandai placeholder; backend mengganti dengan path hasil upload.
        document: item.documentFile
          ? `upload-sk:${person.id}-sk-${index}`
          : (item.document ?? null),
        document_name: item.document_name || null,
      })),
      start_date: person.start_date || null,
      end_date: person.end_date || null,
      start_year: person.start_year ?? null,
      end_year: person.end_year ?? null,
      photo: person.photoFile ? `upload:${person.id}` : person.photo,
      signature: person.signatureFile ? `upload-signature:${person.id}` : person.signature,
      rt_number: person.rt_number || '',
      rw_number: person.rw_number || '',
      padukuhan: person.padukuhan || '',
      sk_number: person.sk_number?.trim() ?? '',
      sk_document: person.skFile
        ? `upload-sk:${person.id}-sk-main`
        : (person.sk_document ?? null),
      sk_document_name: person.sk_document_name || null,
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
    const files = form.people.flatMap((person) => [
      person.photoFile ? { token: person.id, file: person.photoFile } : null,
      person.signatureFile ? { token: person.id, file: person.signatureFile, type: 'signature' } : null,
      person.skFile ? { token: `${person.id}-sk-main`, file: person.skFile, type: 'sk' } : null,
      ...(person.position_history ?? []).map((item, index) => (
        item.documentFile
          ? { token: `${person.id}-sk-${index}`, file: item.documentFile, type: 'sk' }
          : null
      )),
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
          staff_id: item.staff_id ?? null,
          jabatan: item.jabatan,
          nama: item.nama,
          rt_number: item.rt_number,
          rw_number: item.rw_number,
          padukuhan: item.padukuhan,
          start_year: item.start_year,
          end_year: item.end_year,
          start_date: item.start_date || null,
          end_date: item.end_date || null,
          desc: item.desc,
          gender: item.gender ?? null,
          birth_date: item.birth_date ?? '',
          education: item.education ?? null,
          major: item.major?.trim() ?? '',
          school_name: item.school_name?.trim() ?? '',
          graduation_year: item.graduation_year ?? null,
          sk_number: item.sk_number?.trim() ?? '',
          position_history: (item.position_history ?? []).map((h) => ({
            sk: h.sk,
            date: h.date,
            official: h.official,
          })),
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

  const rtNumber = String(personForm.rt_number ?? '').trim()
  const rwNumber = String(personForm.rw_number ?? '').trim()
  const padukuhan = String(personForm.padukuhan ?? '').trim()
  if (isKetuaRt.value && (!rtNumber || !rwNumber || !padukuhan)) {
    toast.add({ severity: 'error', summary: 'Nomor RT, nomor RW, dan padukuhan wajib diisi', life: 2500 })
    return
  }
  if (isKetuaRw.value && (!rwNumber || !padukuhan)) {
    toast.add({ severity: 'error', summary: 'Nomor RW dan padukuhan wajib diisi', life: 2500 })
    return
  }

  const dukuhNumber = String(personForm.dukuh_number ?? '').trim().toUpperCase()
  if (isDukuh.value) {
    if (!padukuhan) {
      toast.add({ severity: 'error', summary: 'Nama padukuhan wajib diisi', life: 2500 })
      return
    }
    if (dukuhNumber && !/^([IVXLCDM]+|\d+)$/.test(dukuhNumber)) {
      toast.add({ severity: 'error', summary: 'Nomor urut dukuh harus angka Romawi (mis. I, II, XIII)', life: 2500 })
      return
    }
  }

  if (personForm.end_date && !personForm.start_date) {
    toast.add({ severity: 'error', summary: 'Tanggal mulai wajib diisi jika tanggal selesai diisi', life: 2500 })
    return
  }
  if (personForm.start_date && personForm.end_date && personForm.end_date < personForm.start_date) {
    toast.add({ severity: 'error', summary: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai', life: 2500 })
    return
  }

  const rtRw = isRtRw.value
  // Jika tanggal diisi, tahun diturunkan dari tanggal; jika tidak, data tahun lama dipertahankan.
  const usesDates = !!personForm.start_date

  const data = {
    jabatan: isDukuh.value ? composeDukuhLabel(dukuhNumber, padukuhan) : personForm.jabatan,
    nama,
    desc: personForm.desc.trim(),
    gender: personForm.gender,
    education: personForm.education,
    major: personForm.major.trim(),
    school_name: personForm.school_name.trim(),
    graduation_year: personForm.graduation_year,
    birth_date: personForm.birth_date,
    // Tanggal habis jabatan = tanggal selesai masa jabatan (dikirim juga agar halaman publik tetap terbaca).
    term_end_date: usesDates ? (personForm.end_date || '') : (personForm.term_end_date || ''),
    // Baris riwayat yang benar-benar kosong tidak ikut disimpan.
    position_history: personForm.position_history
      .map((item) => ({
        sk: item.sk.trim(),
        date: item.date,
        official: item.official.trim(),
        document: item.document ?? null,
        document_name: item.document_name ?? '',
        documentFile: item.documentFile ?? null,
      }))
      .filter((item) => item.sk || item.date || item.official || item.document || item.documentFile),
    start_date: personForm.start_date || '',
    end_date: personForm.end_date || '',
    start_year: usesDates ? yearOf(personForm.start_date) : personForm.start_year,
    end_year: usesDates ? yearOf(personForm.end_date) : personForm.end_year,
    photo: rtRw ? null : personForm.photo,
    photoFile: rtRw ? null : personForm.photoFile,
    signature: rtRw ? null : personForm.signature,
    signatureFile: rtRw ? null : personForm.signatureFile,
    rt_number: isKetuaRt.value ? rtNumber : '',
    rw_number: rtRw ? rwNumber : '',
    padukuhan: rtRw || isDukuh.value ? padukuhan : '',
    sk_number: personForm.sk_number.trim(),
    sk_document: personForm.sk_document,
    sk_document_name: personForm.sk_document_name ?? '',
    skFile: personForm.skFile,
  }

  const wasEditing = !!editingPersonId.value
  if (wasEditing) {
    form.people = form.people.map((p) => (p.id === editingPersonId.value ? { ...p, ...data } : p))
  } else {
    form.people = [...form.people, { id: uid(), ...data }]
  }

  const saved = await persistStructure()
  if (!saved) return

  toast.add({
    severity: 'success',
    summary: wasEditing ? 'Data pamong diperbarui' : 'Staff ditambahkan',
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

// Nama padukuhan diambil dari semua jabatan Dukuh (termasuk padukuhan baru hasil pemekaran).
const padukuhanOptions = computed(() => {
  const names = [
    ...allJabatanOptions.value.map((option) => option.label),
    ...form.people.map((person) => person.jabatan),
  ]
    .filter(isDukuhLabel)
    .map((label) => parseDukuhLabel(label).name)
    .filter(Boolean)
  return [...new Set(names)]
})

const formerIsKetuaRt = computed(() => formerForm.jabatan === JABATAN_KETUA_RT)
const formerIsKetuaRw = computed(() => formerForm.jabatan === JABATAN_KETUA_RW)
const formerIsDukuh = computed(() => formerForm.jabatan === JABATAN_DUKUH)

// Contoh hasil: "Dukuh XIII Krebet Baru".
const formerDukuhLabelPreview = computed(() =>
  composeDukuhLabel(formerForm.dukuh_number, formerForm.padukuhan),
)

const formerSchoolNameLabel = computed(() => (
  isHigherEducation(formerForm.education) ? 'Nama Instansi Pendidikan' : 'Nama Sekolah'
))
const formerSchoolNamePlaceholder = computed(() => (
  isHigherEducation(formerForm.education) ? 'mis. Universitas Negeri Yogyakarta' : 'mis. SMA Negeri 1 Yogyakarta'
))

// Usia dihitung dari tanggal lahir (tidak disimpan di database).
function calcAge(birthDate) {
  if (!birthDate) return null
  const b = new Date(`${String(birthDate).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(b.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1
  return age >= 0 ? age : null
}

function padNumber(value) {
  const v = String(value ?? '').trim()
  return /^\d+$/.test(v) ? v.padStart(2, '0') : v
}

// Contoh: "Ketua RT 01", "Ketua RW 02". Dipakai juga di tabel pamong.
function formatJabatanFormer(item) {
  if (item?.jabatan === JABATAN_KETUA_RT && item.rt_number) return `${item.jabatan} ${padNumber(item.rt_number)}`
  if (item?.jabatan === JABATAN_KETUA_RW && item.rw_number) return `${item.jabatan} ${padNumber(item.rw_number)}`
  return item?.jabatan ?? ''
}

// Contoh: "RW 02, Padukuhan Krebet" (RT) atau "Padukuhan Krebet" (RW).
function formatWilayahFormer(item) {
  if (isDukuhLabel(item?.jabatan)) {
    const name = item.padukuhan || parseDukuhLabel(item.jabatan).name
    return name ? `Padukuhan ${name}` : '—'
  }
  const parts = []
  if (item?.jabatan === JABATAN_KETUA_RT && item.rw_number) parts.push(`RW ${padNumber(item.rw_number)}`)
  if ((item?.jabatan === JABATAN_KETUA_RT || item?.jabatan === JABATAN_KETUA_RW) && item.padukuhan) {
    parts.push(`Padukuhan ${item.padukuhan}`)
  }
  return parts.length ? parts.join(', ') : '—'
}

// Urutan mengikuti JABATAN_OPTIONS (Lurah dst.); semua Dukuh digabung jadi satu opsi "Dukuh".
// Duplikat (termasuk beda huruf besar/kecil, spasi, atau ejaan Staf/Staff) dibuang.
const formerJabatanOptions = computed(() => {
  const list = []
  const seen = new Set()
  allJabatanOptions.value.forEach(({ label }) => {
    const value = isDukuhLabel(label) ? JABATAN_DUKUH : canonicalStaff(label)
    const key = jabatanKey(value)
    if (!key || seen.has(key)) return
    seen.add(key)
    list.push(value)
  })
  return list
})

function yearOf(date) {
  const year = parseInt(String(date ?? '').slice(0, 4), 10)
  return Number.isNaN(year) ? null : year
}

// "2022-02-22" -> "22 Feb 2022" (tanpa konversi zona waktu).
function formatDate(value, month = 'short') {
  const [y, m, d] = String(value ?? '').split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month, year: 'numeric' })
}

function formatMasaJabatan(item) {
  if (item?.start_date) {
    return `${formatDate(item.start_date)} – ${item.end_date ? formatDate(item.end_date) : 'Sekarang'}`
  }
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

const emptyFormerForm = () => ({
  jabatan: null,
  nama: '',
  desc: '',
  rt_number: '',
  rw_number: '',
  padukuhan: '',
  dukuh_number: '',
  start_date: '',
  end_date: '',
  // start_year / end_year = data lama (hanya tahun), dipertahankan agar tidak hilang.
  start_year: null,
  end_year: null,
  sk_number: '',
  gender: null,
  birth_date: '',
  education: null,
  major: '',
  school_name: '',
  graduation_year: null,
  position_history: [],
})
const formerForm = reactive(emptyFormerForm())

// Bersihkan isian yang tidak relevan saat jabatan berganti.
// Harus diletakkan SETELAH formerForm dibuat.
watch(
  () => formerForm.jabatan,
  (jabatan) => {
    const rt = jabatan === JABATAN_KETUA_RT
    const rw = jabatan === JABATAN_KETUA_RW
    const dukuh = jabatan === JABATAN_DUKUH
    if (!rt) formerForm.rt_number = ''
    if (!rt && !rw) formerForm.rw_number = ''
    if (!rt && !rw && !dukuh) formerForm.padukuhan = ''
    if (!dukuh) formerForm.dukuh_number = ''
  },
)

function openNewFormer() {
  editingFormerId.value = null
  Object.assign(formerForm, emptyFormerForm())
  formerDialogVisible.value = true
}

function openEditFormer(item) {
  editingFormerId.value = item.id
  Object.assign(formerForm, {
    // Data lama "Dukuh I Krebet" dipetakan ke opsi "Dukuh" + nomor urut + nama padukuhan.
    jabatan: isDukuhLabel(item.jabatan) ? JABATAN_DUKUH : item.jabatan,
    dukuh_number: isDukuhLabel(item.jabatan) ? parseDukuhLabel(item.jabatan).number : '',
    nama: item.nama,
    desc: item.desc ?? '',
    rt_number: item.rt_number ?? '',
    rw_number: item.rw_number ?? '',
    padukuhan: item.padukuhan || (isDukuhLabel(item.jabatan) ? parseDukuhLabel(item.jabatan).name : ''),
    start_date: item.start_date ?? '',
    end_date: item.end_date ?? '',
    start_year: item.start_year ?? null,
    end_year: item.end_year ?? null,
    sk_number: item.sk_number ?? '',
    gender: item.gender ?? null,
    birth_date: item.birth_date ?? '',
    education: item.education ?? null,
    major: item.major ?? '',
    school_name: item.school_name ?? '',
    graduation_year: item.graduation_year ?? null,
    position_history: seedFormerHistory(item.position_history),
  })
  formerDialogVisible.value = true
}

function closeFormerDialog() {
  formerDialogVisible.value = false
  editingFormerId.value = null
  Object.assign(formerForm, emptyFormerForm())
}

/* ---- Riwayat jabatan pejabat terdahulu (SK, tanggal, pejabat penerbit) ---- */
function addFormerHistoryRow() {
  formerForm.position_history.push({ sk: '', date: '', official: '' })
}

function removeFormerHistoryRow(index) {
  formerForm.position_history.splice(index, 1)
}

async function saveFormerDialog() {
  const selectedJabatan = (formerForm.jabatan || '').trim()
  const nama = formerForm.nama.trim()
  if (!selectedJabatan || !nama) {
    toast.add({ severity: 'error', summary: 'Jabatan dan nama wajib diisi', life: 2500 })
    return
  }
  const rtNumber = String(formerForm.rt_number ?? '').trim()
  const rwNumber = String(formerForm.rw_number ?? '').trim()
  const padukuhan = String(formerForm.padukuhan ?? '').trim()
  const dukuhNumber = String(formerForm.dukuh_number ?? '').trim().toUpperCase()

  if (selectedJabatan === JABATAN_KETUA_RT && (!rtNumber || !rwNumber || !padukuhan)) {
    toast.add({ severity: 'error', summary: 'Nomor RT, nomor RW, dan padukuhan wajib diisi', life: 2500 })
    return
  }
  if (selectedJabatan === JABATAN_KETUA_RW && (!rwNumber || !padukuhan)) {
    toast.add({ severity: 'error', summary: 'Nomor RW dan padukuhan wajib diisi', life: 2500 })
    return
  }
  if (selectedJabatan === JABATAN_DUKUH) {
    if (!padukuhan) {
      toast.add({ severity: 'error', summary: 'Nama padukuhan wajib diisi', life: 2500 })
      return
    }
    if (dukuhNumber && !/^([IVXLCDM]+|\d+)$/.test(dukuhNumber)) {
      toast.add({ severity: 'error', summary: 'Nomor urut dukuh harus angka Romawi (mis. I, II, XIII)', life: 2500 })
      return
    }
  }

  // Label final: "Dukuh XIII Krebet Baru" untuk dukuh, selain itu apa adanya.
  const jabatan = selectedJabatan === JABATAN_DUKUH
    ? composeDukuhLabel(dukuhNumber, padukuhan)
    : selectedJabatan

  // Masa jabatan: pejabat terdahulu wajib punya tanggal mulai & selesai.
  // Data lama yang hanya berisi tahun tetap boleh disimpan apa adanya.
  const hasStart = !!formerForm.start_date
  const hasEnd = !!formerForm.end_date
  if (hasStart !== hasEnd) {
    toast.add({ severity: 'error', summary: 'Tanggal mulai dan tanggal selesai harus diisi keduanya', life: 2500 })
    return
  }
  const usesDates = hasStart && hasEnd
  const hasLegacyYears = !!formerForm.start_year && !!formerForm.end_year
  if (!usesDates && !hasLegacyYears) {
    toast.add({ severity: 'error', summary: 'Masa jabatan (tanggal mulai & selesai) wajib diisi', life: 2500 })
    return
  }
  if (usesDates && formerForm.end_date < formerForm.start_date) {
    toast.add({ severity: 'error', summary: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai', life: 2500 })
    return
  }
  if (!usesDates && formerForm.end_year < formerForm.start_year) {
    toast.add({ severity: 'error', summary: 'Tahun selesai tidak boleh lebih kecil dari tahun mulai', life: 2500 })
    return
  }

  const isRtRwFormer = selectedJabatan === JABATAN_KETUA_RT || selectedJabatan === JABATAN_KETUA_RW

  const entry = {
    jabatan, // sudah berupa label final
    nama,
    desc: formerForm.desc.trim(),
    rt_number: selectedJabatan === JABATAN_KETUA_RT ? rtNumber : '',
    rw_number: isRtRwFormer ? rwNumber : '',
    padukuhan: isRtRwFormer || selectedJabatan === JABATAN_DUKUH ? padukuhan : '',
    start_date: usesDates ? formerForm.start_date : '',
    end_date: usesDates ? formerForm.end_date : '',
    // Jika tanggal diisi, tahun diturunkan dari tanggal (dipakai tabel & halaman publik).
    start_year: usesDates ? yearOf(formerForm.start_date) : formerForm.start_year,
    end_year: usesDates ? yearOf(formerForm.end_date) : formerForm.end_year,
    sk_number: formerForm.sk_number.trim(),
    gender: formerForm.gender,
    birth_date: formerForm.birth_date,
    education: formerForm.education,
    major: formerForm.major.trim(),
    school_name: formerForm.school_name.trim(),
    graduation_year: formerForm.graduation_year,
    // Baris riwayat yang benar-benar kosong tidak ikut disimpan.
    position_history: formerForm.position_history
      .map((h) => ({ sk: h.sk.trim(), date: h.date, official: h.official.trim() }))
      .filter((h) => h.sk || h.date || h.official),
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
        <span class="text-sm font-semibold text-slate-700">Daftar Pamong Kalurahan</span>
      </template>
      <template #content>
        <!-- Toolbar CRUD -->
        <div class="mb-3 flex items-center gap-2">
          <Button label="Tambah Staff" icon="pi pi-plus" size="small" @click="openNewPerson" />
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
              Belum ada pamong. Klik "Tambah Staff" untuk mulai.
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
                {{ formatJabatanFormer(data) || 'Belum dipilih' }}
              </span>
            </template>
          </Column>

          <Column header="Wilayah">
            <template #body="{ data }">
              <span class="whitespace-nowrap text-slate-600">{{ formatWilayahFormer(data) }}</span>
            </template>
          </Column>

          <Column field="nama" header="Nama" />

          <Column field="education" header="Jenjang Pendidikan">
            <template #body="{ data }">
              <div v-if="data.education" class="leading-snug">
                <span class="text-slate-700">{{ data.education }}</span>
                <span v-if="data.major" class="block text-xs text-slate-400">{{ data.major }}</span>
              </div>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="birth_date" header="Usia" headerStyle="width: 5rem">
            <template #body="{ data }">
              <span class="whitespace-nowrap text-slate-600">{{ calcAge(data.birth_date) !== null ? `${calcAge(data.birth_date)} th` : '—' }}</span>
            </template>
          </Column>

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

          <Column header="Aksi" headerStyle="width: 8.5rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button icon="pi pi-eye" text rounded size="small" severity="secondary" @click="openPreview(data)" aria-label="Lihat detail pamong" />
                <Button icon="pi pi-pencil" text rounded size="small" @click="openEditPerson(data)" aria-label="Edit pamong" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deletePerson(data)" aria-label="Hapus pamong" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- ===== Pejabat Terdahulu (termasuk Ketua RT / Ketua RW) ===== -->
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
          <Column field="jabatan" header="Jabatan" sortable>
            <template #body="{ data }">{{ formatJabatanFormer(data) }}</template>
          </Column>
          <Column field="nama" header="Nama" sortable />
          <Column header="Wilayah">
            <template #body="{ data }">{{ formatWilayahFormer(data) }}</template>
          </Column>
          <Column field="start_year" header="Masa Jabatan" sortable>
            <template #body="{ data }">{{ formatMasaJabatan(data) }}</template>
          </Column>
          <Column field="desc" header="Keterangan">
            <template #body="{ data }">
              <span class="line-clamp-1 text-slate-500">{{ data.desc || '—' }}</span>
            </template>
          </Column>
          <Column header="Aksi" headerStyle="width: 8.5rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button icon="pi pi-eye" text rounded size="small" severity="secondary" @click="openPreviewFormer(data)" aria-label="Lihat detail pejabat terdahulu" />
                <Button icon="pi pi-pencil" text rounded size="small" @click="openEditFormer(data)" aria-label="Edit pejabat terdahulu" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deleteFormer(data)" aria-label="Hapus pejabat terdahulu" />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Modal Tambah / Edit Pejabat Terdahulu (isian mengikuti form Tambah Staff) -->
    <Dialog
      v-model:visible="formerDialogVisible"
      modal
      :header="formerDialogTitle"
      :style="{ width: '640px' }"
      :breakpoints="{ '700px': '95vw' }"
      :closable="true"
      @hide="closeFormerDialog"
    >
      <div class="flex flex-col gap-5">
        <!-- ===== Data jabatan ===== -->
        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Data Jabatan</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Nama</label>
              <InputText v-model="formerForm.nama" placeholder="Nama lengkap" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jabatan</label>
              <Select
                v-model="formerForm.jabatan"
                :options="formerJabatanOptions"
                editable
                filter
                placeholder="Pilih atau ketik jabatan (mis. Ketua RT)"
                fluid
              />
            </div>
          </div>

          <!-- Isian khusus Ketua RT / Ketua RW -->
          <div v-if="formerIsKetuaRt || formerIsKetuaRw" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div v-if="formerIsKetuaRt" class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Nomor RT</label>
              <InputText v-model="formerForm.rt_number" placeholder="mis. 01" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Nomor RW</label>
              <InputText v-model="formerForm.rw_number" placeholder="mis. 02" fluid />
            </div>
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-[13px] font-semibold text-slate-700">Padukuhan</label>
              <Select
                v-model="formerForm.padukuhan"
                :options="padukuhanOptions"
                editable
                filter
                placeholder="Pilih atau ketik padukuhan"
                fluid
              />
            </div>
          </div>

          <!-- Isian khusus Dukuh -->
          <div v-if="formerIsDukuh" class="flex flex-col gap-1.5">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-slate-700">Nomor Urut Dukuh</label>
                <InputText v-model="formerForm.dukuh_number" placeholder="mis. XIII" fluid />
              </div>
              <div class="flex flex-col gap-1.5 sm:col-span-2">
                <label class="text-[13px] font-semibold text-slate-700">Nama Padukuhan</label>
                <InputText v-model="formerForm.padukuhan" placeholder="mis. Krebet" fluid />
              </div>
            </div>
            <small class="text-xs text-slate-400">
              Nomor urut memakai angka Romawi.
              <template v-if="formerDukuhLabelPreview">
                Jabatan akan tampil sebagai <strong class="text-slate-600">{{ formerDukuhLabelPreview }}</strong>.
              </template>
            </small>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Keterangan</label>
            <InputText v-model="formerForm.desc" placeholder="Keterangan (opsional)" fluid />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Masa Jabatan</label>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1">
                <small class="text-xs text-slate-500">Tanggal mulai</small>
                <InputText v-model="formerForm.start_date" type="date" fluid />
              </div>
              <div class="flex flex-col gap-1">
                <small class="text-xs text-slate-500">Tanggal selesai</small>
                <InputText v-model="formerForm.end_date" type="date" :min="formerForm.start_date || undefined" fluid />
              </div>
            </div>
            <small class="text-xs text-slate-400">Kedua tanggal wajib diisi karena pejabat ini sudah tidak menjabat.</small>
            <small
              v-if="!formerForm.start_date && !formerForm.end_date && (formerForm.start_year || formerForm.end_year)"
              class="text-xs text-amber-600"
            >
              Data lama hanya berisi tahun ({{ formatMasaJabatan({ start_year: formerForm.start_year, end_year: formerForm.end_year }) }}).
              Isi tanggal lengkap untuk memperbarui.
            </small>
          </div>
        </section>

        <!-- ===== Surat Keputusan (SK) ===== -->
        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Surat Keputusan (SK)</h3>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">
              Nomor SK <span class="font-normal text-slate-400">(opsional)</span>
            </label>
            <InputText v-model="formerForm.sk_number" placeholder="mis. 1/Kep.Lurah/2014" fluid />
          </div>
        </section>

        <!-- ===== Data pribadi & pendidikan ===== -->
        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Data Pribadi &amp; Pendidikan</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jenis Kelamin</label>
              <Select v-model="formerForm.gender" :options="GENDER_OPTIONS" placeholder="Pilih jenis kelamin" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Tanggal Lahir</label>
              <InputText v-model="formerForm.birth_date" type="date" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jenjang Pendidikan</label>
              <Select
                v-model="formerForm.education"
                :options="EDUCATION_OPTIONS"
                editable
                placeholder="Pilih atau ketik jenjang pendidikan"
                fluid
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jurusan</label>
              <InputText v-model="formerForm.major" placeholder="mis. Manajemen" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">{{ formerSchoolNameLabel }}</label>
              <InputText v-model="formerForm.school_name" :placeholder="formerSchoolNamePlaceholder" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Tahun Lulus</label>
              <InputNumber v-model="formerForm.graduation_year" :useGrouping="false" :min="1900" :max="2100" placeholder="mis. 1995" fluid />
            </div>
          </div>
        </section>

        <!-- ===== Riwayat jabatan ===== -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Riwayat Jabatan</h3>
            <Button label="Tambah Riwayat" icon="pi pi-plus" size="small" text @click="addFormerHistoryRow" />
          </div>

          <div
            v-if="!formerForm.position_history.length"
            class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400"
          >
            Belum ada riwayat jabatan.
          </div>

          <div
            v-for="(item, index) in formerForm.position_history"
            :key="index"
            class="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
          >
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Judul / Nomor SK</label>
                <InputText v-model="item.sk" placeholder="mis. 1/Kep.Lurah/2014" size="small" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Tanggal SK</label>
                <InputText v-model="item.date" type="date" size="small" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Pejabat Penerbit</label>
                <InputText v-model="item.official" placeholder="mis. Lurah" size="small" fluid />
              </div>
            </div>

            <div class="mt-2 flex justify-end">
              <Button
                label="Hapus Riwayat"
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                @click="removeFormerHistoryRow(index)"
              />
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text severity="secondary" :disabled="saving" @click="closeFormerDialog" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="saveFormerDialog" />
      </template>
    </Dialog>

    <!-- Modal Preview Detail Pamong / Pejabat Terdahulu (gaya mengikuti pop up halaman publik) -->
    <Dialog
      v-model:visible="previewDialogVisible"
      modal
      dismissableMask
      :showHeader="false"
      :style="{ width: '600px' }"
      :breakpoints="{ '700px': '95vw' }"
      :pt="{
        root: { class: '!overflow-hidden !rounded-3xl' },
        content: { class: '!p-0' },
        footer: { class: '!border-t !border-slate-100 !pt-3' },
      }"
      @hide="closePreview"
    >
      <div v-if="previewPerson" class="relative pb-6">
        <!-- Latar header: ganti kelas gradient di bawah untuk mengubah warna -->
        <div class="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-[#2a9fd8] to-[#1a5a8a]" />

        <Button
          icon="pi pi-times"
          rounded
          text
          severity="secondary"
          class="!absolute right-3 top-3 z-20 !bg-white/20 !text-white hover:!bg-white/30"
          aria-label="Tutup"
          @click="closePreview"
        />

        <div class="relative z-10 flex flex-col items-center px-6 pt-6 text-center">
          <span class="rounded-full bg-amber-400 px-4 py-1 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-900">
            {{ formatJabatanFormer(previewPerson) }}
          </span>

          <div class="mt-4 h-36 w-36 overflow-hidden rounded-3xl border-4 border-white bg-blue-100 shadow-lg">
            <img
              v-if="previewPerson.photo"
              :src="photoSrc(previewPerson.photo)"
              :alt="previewPerson.nama"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-4xl font-bold text-blue-700">
              {{ initials(previewPerson.nama) }}
            </div>
          </div>

          <h2 class="m-0 mt-4 text-2xl font-extrabold text-slate-900">{{ previewPerson.nama }}</h2>

          <span class="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
            <i class="pi pi-briefcase text-xs" />
            {{ previewJabatanFull }}
          </span>

          <p v-if="previewPerson.desc" class="m-0 mt-3 text-sm text-slate-500">{{ previewPerson.desc }}</p>
        </div>

        <div class="relative z-10 mt-6 flex flex-col gap-6 px-6">
          <!-- Informasi pamong -->
          <section class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="h-px w-6 bg-blue-600" />
              <h3 class="m-0 text-xs font-bold uppercase tracking-widest text-blue-700">
                {{ previewKind === 'former' ? 'Informasi Pejabat' : 'Informasi Pamong' }}
              </h3>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                v-for="card in previewInfoCards"
                :key="card.label"
                class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <i :class="['pi', card.icon]" />
                </span>
                <div class="min-w-0">
                  <p class="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ card.label }}</p>
                  <p class="m-0 break-words text-sm font-semibold text-slate-700">{{ card.value || '—' }}</p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <i class="pi pi-clock" />
              </span>
              <div>
                <p class="m-0 text-[11px] font-bold uppercase tracking-wider text-amber-700">Tanggal Habis Jabatan</p>
                <p class="m-0 text-sm font-semibold text-slate-700">
                  {{ formatDate(previewPerson.end_date || previewPerson.term_end_date, 'long') || '—' }}
                </p>
              </div>
            </div>
          </section>

          <!-- Surat keputusan -->
          <section class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="h-px w-6 bg-blue-600" />
              <h3 class="m-0 text-xs font-bold uppercase tracking-widest text-blue-700">Surat Keputusan (SK)</h3>
            </div>

            <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <i class="pi pi-file" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="m-0 text-[11px] font-bold uppercase tracking-wider text-slate-400">Nomor SK</p>
                <p class="m-0 break-words text-sm font-semibold text-slate-700">{{ previewPerson.sk_number || '—' }}</p>
                <p v-if="previewPerson.sk_document_name" class="m-0 truncate text-xs text-slate-400" :title="previewPerson.sk_document_name">
                  {{ previewPerson.sk_document_name }}
                </p>
              </div>
              <a
                v-if="previewPerson.sk_document"
                :href="photoSrc(previewPerson.sk_document)"
                target="_blank"
                rel="noopener"
                class="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
              >
                Buka dokumen
              </a>
            </div>
          </section>

          <!-- Riwayat jabatan -->
          <section class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="h-px w-6 bg-blue-600" />
              <h3 class="m-0 text-xs font-bold uppercase tracking-widest text-blue-700">Riwayat Jabatan</h3>
            </div>

            <div
              v-if="!previewPerson.position_history?.length"
              class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-400"
            >
              Belum ada riwayat jabatan.
            </div>

            <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
              <li
                v-for="(item, index) in previewPerson.position_history"
                :key="index"
                class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <i class="pi pi-history text-sm" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="m-0 font-semibold">SK: {{ item.sk || '—' }}</p>
                  <p class="m-0 text-xs text-slate-500">
                    Tgl: {{ item.date ? formatDate(item.date, 'long') : '—' }} · Pejabat: {{ item.official || '—' }}
                  </p>
                </div>
                <a
                  v-if="item.document"
                  :href="photoSrc(item.document)"
                  target="_blank"
                  rel="noopener"
                  class="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
                >
                  Dokumen
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <template #footer>
        <Button label="Tutup" icon="pi pi-times" text severity="secondary" @click="closePreview" />
        <Button label="Edit" icon="pi pi-pencil" @click="editFromPreview" />
      </template>
    </Dialog>

    <!-- Modal Tambah Staff / Edit Pamong -->
    <Dialog
      v-model:visible="personDialogVisible"
      modal
      :header="personDialogTitle"
      :dismissableMask="!isPersonFormDirty"
      :closeOnEscape="!isPersonFormDirty"
      :style="{ width: '640px' }"
      :breakpoints="{ '700px': '95vw' }"
      :closable="true"
      @hide="closePersonDialog"
    >
      <input ref="personPhotoInput" type="file" accept="image/*" class="hidden" @change="onPersonPhotoChange" />
      <input ref="personSignatureInput" type="file" accept="image/*" class="hidden" @change="onPersonSignatureChange" />
      <input ref="skFileInput" type="file" :accept="SK_ACCEPT" class="hidden" @change="onSkFileChange" />
      <input ref="mainSkInput" type="file" :accept="SK_ACCEPT" class="hidden" @change="onMainSkChange" />

      <div class="flex flex-col gap-5">
        <!-- ===== Foto & tanda tangan ===== -->
        <section v-if="showPhoto" class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">
            {{ showSignature ? 'Foto & Tanda Tangan' : 'Foto' }}
          </h3>

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

          <!-- Tanda tangan: tidak dipakai untuk Ketua RT / RW dan Dukuh -->
          <div v-if="showSignature" class="flex flex-col gap-1.5">
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
        </section>

        <!-- ===== Data jabatan ===== -->
        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Data Jabatan</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Nama</label>
              <InputText v-model="personForm.nama" placeholder="Nama lengkap" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jabatan</label>
              <Select
                v-model="personForm.jabatan"
                :options="jabatanDropdownOptions"
                optionLabel="label"
                optionValue="label"
                placeholder="Pilih jabatan"
                :filter="editingPersonId !== null"
                fluid
              />
            </div>
          </div>

          <!-- Isian khusus Ketua RT / Ketua RW -->
          <div v-if="isRtRw" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div v-if="isKetuaRt" class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Nomor RT</label>
              <InputText v-model="personForm.rt_number" placeholder="mis. 01" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Nomor RW</label>
              <InputText v-model="personForm.rw_number" placeholder="mis. 02" fluid />
            </div>
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-[13px] font-semibold text-slate-700">Padukuhan</label>
              <Select
                v-model="personForm.padukuhan"
                :options="padukuhanOptions"
                editable
                filter
                placeholder="Pilih atau ketik padukuhan"
                fluid
              />
            </div>
          </div>

          <!-- Isian khusus Dukuh -->
          <div v-if="isDukuh" class="flex flex-col gap-1.5">
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-[13px] font-semibold text-slate-700">Nomor Urut Dukuh</label>
                <InputText v-model="personForm.dukuh_number" placeholder="mis. XIII" fluid />
              </div>
              <div class="flex flex-col gap-1.5 sm:col-span-2">
                <label class="text-[13px] font-semibold text-slate-700">Nama Padukuhan</label>
                <InputText v-model="personForm.padukuhan" placeholder="mis. Krebet" fluid />
              </div>
            </div>
            <small class="text-xs text-slate-400">
              Nomor urut memakai angka Romawi.
              <template v-if="dukuhLabelPreview">
                Jabatan akan tampil sebagai <strong class="text-slate-600">{{ dukuhLabelPreview }}</strong>.
              </template>
            </small>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Deskripsi</label>
            <InputText v-model="personForm.desc" placeholder="Deskripsi jabatan (opsional)" fluid />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Masa Jabatan</label>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1">
                <small class="text-xs text-slate-500">Tanggal mulai</small>
                <InputText v-model="personForm.start_date" type="date" fluid />
              </div>
              <div class="flex flex-col gap-1">
                <small class="text-xs text-slate-500">Tanggal selesai</small>
                <InputText v-model="personForm.end_date" type="date" :min="personForm.start_date || undefined" fluid />
              </div>
            </div>
            <small class="text-xs text-slate-400">Kosongkan tanggal selesai jika masih menjabat (tampil "Sekarang").</small>
            <small
              v-if="!personForm.start_date && (personForm.start_year || personForm.end_year)"
              class="text-xs text-amber-600"
            >
              Data lama hanya berisi tahun ({{ formatMasaJabatan({ start_year: personForm.start_year, end_year: personForm.end_year }) }}).
              Isi tanggal lengkap untuk memperbarui.
            </small>
          </div>

        </section>

        <!-- ===== Surat Keputusan (SK) ===== -->
        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Surat Keputusan (SK)</h3>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Nomor SK</label>
            <InputText v-model="personForm.sk_number" placeholder="mis. 1/Kep.Lurah/2022" fluid />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">
              Dokumen SK <span class="font-normal text-slate-400">(opsional)</span>
            </label>

            <div
              v-if="personForm.skFile || personForm.sk_document"
              class="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2"
            >
              <i class="pi pi-file text-blue-600" />
              <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700" :title="personForm.sk_document_name">
                {{ personForm.sk_document_name || 'Dokumen SK' }}
              </span>
              <span v-if="personForm.skFile" class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Belum disimpan
              </span>
              <Button label="Ganti" size="small" text @click="triggerMainSkUpload" />
              <Button icon="pi pi-times" size="small" text rounded severity="danger" aria-label="Hapus dokumen" @click="removeMainSk" />
            </div>

            <div v-else class="flex items-center gap-3">
              <Button label="Upload Dokumen" icon="pi pi-upload" size="small" outlined @click="triggerMainSkUpload" />
              <small class="text-xs text-slate-400">PDF, Word, atau gambar (maks. {{ SK_MAX_SIZE_MB }} MB).</small>
            </div>
          </div>
        </section>

        <!-- ===== Data pribadi & pendidikan ===== -->
        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Data Pribadi &amp; Pendidikan</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jenis Kelamin</label>
              <Select v-model="personForm.gender" :options="GENDER_OPTIONS" placeholder="Pilih jenis kelamin" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Tanggal Lahir</label>
              <InputText v-model="personForm.birth_date" type="date" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jenjang Pendidikan</label>
              <Select
                v-model="personForm.education"
                :options="EDUCATION_OPTIONS"
                editable
                placeholder="Pilih atau ketik jenjang pendidikan"
                fluid
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jurusan</label>
              <InputText v-model="personForm.major" placeholder="mis. Manajemen" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">{{ schoolNameLabel }}</label>
              <InputText v-model="personForm.school_name" :placeholder="schoolNamePlaceholder" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Tahun Lulus</label>
              <InputNumber v-model="personForm.graduation_year" :useGrouping="false" :min="1900" :max="2100" placeholder="mis. 2019" fluid />
            </div>
          </div>
        </section>

        <!-- ===== Riwayat jabatan ===== -->
        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Riwayat Jabatan</h3>
            <Button label="Tambah Riwayat" icon="pi pi-plus" size="small" text @click="addHistoryRow" />
          </div>

          <div
            v-if="!personForm.position_history.length"
            class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400"
          >
            Belum ada riwayat jabatan.
          </div>

          <div
            v-for="(item, index) in personForm.position_history"
            :key="index"
            class="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
          >
            <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Judul / Nomor SK</label>
                <InputText
                  v-model="item.sk"
                  placeholder="mis. 1/Kep.Lurah/2022"
                  size="small"
                  :readonly="hasSkDocument(item)"
                  fluid
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Tanggal SK</label>
                <InputText v-model="item.date" type="date" size="small" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Pejabat Penerbit</label>
                <InputText v-model="item.official" placeholder="mis. Lurah" size="small" fluid />
              </div>
            </div>

            <!-- Dokumen SK (opsional) -->
            <div class="mt-3 flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">
                Dokumen SK <span class="font-normal text-slate-400">(opsional)</span>
              </label>

              <div
                v-if="hasSkDocument(item)"
                class="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-2"
              >
                <i class="pi pi-file text-blue-600" />
                <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700" :title="item.document_name">
                  {{ item.document_name || 'Dokumen SK' }}
                </span>
                <span v-if="item.documentFile" class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  Belum disimpan
                </span>
                <Button label="Ganti" size="small" text @click="triggerSkUpload(index)" />
                <Button icon="pi pi-times" size="small" text rounded severity="danger" aria-label="Hapus dokumen" @click="removeSkDocument(index)" />
              </div>

              <div v-else class="flex items-center gap-3">
                <Button label="Upload Dokumen" icon="pi pi-upload" size="small" outlined @click="triggerSkUpload(index)" />
                <small class="text-xs text-slate-400">
                  PDF, Word, atau gambar (maks. {{ SK_MAX_SIZE_MB }} MB). Jika diunggah, nama file menjadi judul SK.
                </small>
              </div>
            </div>

            <div class="mt-2 flex justify-end">
              <Button
                label="Hapus Riwayat"
                icon="pi pi-trash"
                size="small"
                text
                severity="danger"
                @click="removeHistoryRow(index)"
              />
            </div>
          </div>
        </section>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text severity="secondary" :disabled="saving" @click="closePersonDialog" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="savePersonDialog" />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>

:deep(.p-avatar img) {
  object-fit: cover;
}
</style>
