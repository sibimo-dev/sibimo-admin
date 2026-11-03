<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import * as XLSX from 'xlsx'

import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { getRegions, createRegion, updateRegion, deleteRegion } from '@/services/region.service'
import { getListCache, setListCache, updateListCache } from '@/services/list-cache'

const toast = useToast()

/* ------------------------------------------------------------------ */
/* Helper format                                                       */
/* ------------------------------------------------------------------ */
const pad2 = (n) => String(n).padStart(2, '0')
const rwLabel = (n) => `RW${pad2(n)}`
const rtLabel = (n) => `RT${pad2(n)}`
const fmt = (n) => Number(n ?? 0).toLocaleString('id-ID')
const toCount = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0
}

// Ubah teks "1-5, 7, RT09" menjadi [1,2,3,4,5,7,9].
// Mengembalikan null jika formatnya tidak valid, [] jika kosong.
function parseRtInput(text) {
  const clean = String(text ?? '')
    .replace(/rt/gi, '')
    .replace(/\s*[-–]\s*/g, '-')
    .trim()
  if (!clean) return []

  const result = new Set()
  for (const part of clean.split(/[,;\s]+/).filter(Boolean)) {
    const range = part.match(/^(\d+)-(\d+)$/)
    if (range) {
      const from = Number(range[1])
      const to = Number(range[2])
      if (from < 1 || to < from || to - from > 99) return null
      for (let i = from; i <= to; i++) result.add(i)
    } else if (/^\d+$/.test(part)) {
      const n = Number(part)
      if (n < 1) return null
      result.add(n)
    } else {
      return null
    }
  }
  return [...result].sort((a, b) => a - b)
}

// [1,2,3,4,5,7] => [[1,5],[7,7]]
function toRanges(list) {
  const ranges = []
  let start = list[0]
  let prev = list[0]
  for (let i = 1; i <= list.length; i++) {
    const cur = list[i]
    if (cur === prev + 1) {
      prev = cur
      continue
    }
    ranges.push([start, prev])
    start = prev = cur
  }
  return ranges
}

// [1,2,3,4,5,7] => "RT01 - RT05, RT07"
function formatRtList(list) {
  if (!list || list.length === 0) return 'Belum ada RT'
  return toRanges(list)
    .map(([s, e]) => (s === e ? rtLabel(s) : `${rtLabel(s)} - ${rtLabel(e)}`))
    .join(', ')
}

const rtNumbers = (rw) => rw.rts.map((rt) => rt.rtNumber)

/* ------------------------------------------------------------------ */
/* Total otomatis: RT -> RW -> Padukuhan                               */
/* Jiwa = laki-laki + perempuan                                        */
/* ------------------------------------------------------------------ */
function sumRts(rts) {
  const t = rts.reduce(
    (acc, rt) => ({
      kk: acc.kk + rt.kk,
      male: acc.male + rt.male,
      female: acc.female + rt.female,
    }),
    { kk: 0, male: 0, female: 0 },
  )
  return { ...t, population: t.male + t.female }
}

function rwTotals(rw) {
  return { ...sumRts(rw.rts), rtCount: rw.rts.length }
}

function hamletTotals(h) {
  // KK, jiwa, dan jenis kelamin tidak diisi manual di sini: pakai angka yang tersimpan
  return {
    kk: h.kkCount,
    male: h.maleCount,
    female: h.femaleCount,
    population: h.population,
    rtCount: h.rws.reduce((s, rw) => s + rw.rts.length, 0),
    rwCount: h.rws.length,
  }
}

/* ------------------------------------------------------------------ */
/* Format data RW/RT untuk disimpan (backend & penyimpanan browser)    */
/* ------------------------------------------------------------------ */
function normalizeRt(rt) {
  if (typeof rt === 'number' || typeof rt === 'string') {
    return { rtNumber: Number(rt), kk: 0, male: 0, female: 0 }
  }
  return {
    rtNumber: Number(rt.rt_number ?? rt.rtNumber),
    kk: toCount(rt.kk_count ?? rt.kk),
    male: toCount(rt.male_count ?? rt.male),
    female: toCount(rt.female_count ?? rt.female),
  }
}

// rws tampilan [{ rwNumber, rts: [{ rtNumber, kk, male, female }] }]
//   -> [{ rw_number, rt_count, kk_count, ..., rts: [{ rt_number, ... }] }]
function serializeRws(rws) {
  return [...rws]
    .sort((a, b) => a.rwNumber - b.rwNumber)
    .map((rw) => {
      const t = rwTotals(rw)
      return {
        rw_number: rw.rwNumber,
        rt_count: t.rtCount,
        kk_count: t.kk,
        male_count: t.male,
        female_count: t.female,
        population: t.population,
        rts: [...rw.rts]
          .sort((a, b) => a.rtNumber - b.rtNumber)
          .map((rt) => ({
            rt_number: rt.rtNumber,
            kk_count: rt.kk,
            male_count: rt.male,
            female_count: rt.female,
            population: rt.male + rt.female,
          })),
      }
    })
}

/* ------------------------------------------------------------------ */
/* Penyimpanan RW/RT sementara di browser (frontend saja).             */
/* Dipakai selama backend belum menyimpan field `rws`.                 */
/* ------------------------------------------------------------------ */
const LOCAL_RWS_KEY = 'region-rws-local'

function readLocalRws() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_RWS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writeLocalRws(regionId, serializedRws) {
  try {
    const all = readLocalRws()
    all[regionId] = serializedRws
    localStorage.setItem(LOCAL_RWS_KEY, JSON.stringify(all))
  } catch {
    // localStorage penuh atau diblokir: abaikan, data tetap tampil di sesi ini
  }
}

function removeLocalRws(regionId) {
  try {
    const all = readLocalRws()
    delete all[regionId]
    localStorage.setItem(LOCAL_RWS_KEY, JSON.stringify(all))
  } catch {
    // abaikan
  }
}

/* ------------------------------------------------------------------ */
/* Import Excel: satu baris = satu RT                                  */
/* ------------------------------------------------------------------ */
const EXCEL_COLUMN_MAP = {
  'Padukuhan': 'name',
  'RW': 'rwNumber',
  'RT': 'rtNumber',
}

const excelFileInput = ref(null)
const importingExcel = ref(false)

/* ------------------------------------------------------------------ */
/* State utama                                                         */
/* ------------------------------------------------------------------ */
const cachedRegions = getListCache('regions')
const hamlets = ref((cachedRegions ?? []).map(toHamletView))
const loadingRegions = ref(!cachedRegions)
const regionLoadError = ref('')
const expandedRows = ref({})

function toggleRow(id) {
  const next = { ...expandedRows.value }
  if (next[id]) delete next[id]
  else next[id] = true
  expandedRows.value = next
}

const totalRw = computed(() => hamlets.value.reduce((sum, h) => sum + h.rws.length, 0))
const totalRt = computed(() =>
  hamlets.value.reduce((sum, h) => sum + h.rws.reduce((s, rw) => s + rw.rts.length, 0), 0),
)

const areaStats = computed(() => [
  {
    label: 'Jumlah Padukuhan',
    value: hamlets.value.length,
    unit: 'Padukuhan',
    icon: 'pi pi-map',
    bg: 'bg-primary-500',
  },
  {
    label: 'Jumlah RW',
    value: totalRw.value,
    unit: 'RW',
    icon: 'pi pi-sitemap',
    bg: 'bg-secondary-600',
  },
  {
    label: 'Jumlah RT',
    value: totalRt.value,
    unit: 'RT',
    icon: 'pi pi-building',
    bg: 'bg-success-600',
  },
  {
    label: 'Batas Wilayah',
    value: neighborCount.value,
    unit: 'Desa Tetangga',
    icon: 'pi pi-compass',
    bg: 'bg-warning-500',
  },
])

const boundaries = reactive({ north: '', south: '', east: '', west: '' })
const neighborCount = computed(
  () => Object.values(boundaries).filter((v) => v && v.trim()).length,
)

const filters = ref({
  global: { value: null },
})

const rowsPerPage = ref(10)
const currentPage = ref(0)

/* Dialog edit detail padukuhan (nama & kepala dukuh) */
const hamletDialogOpen = ref(false)
const editingHamletId = ref(null)
const savingHamlet = ref(false)
const hamletForm = reactive({ name: '' })

/* Dialog batas wilayah */
const boundaryDialogOpen = ref(false)
const boundaryForm = reactive({ north: '', south: '', east: '', west: '' })

/* Dialog struktur wilayah (Padukuhan -> RW -> RT) */
const structureDialogOpen = ref(false)
const newHamletName = ref('')
const addingHamlet = ref(false)
const rwForm = reactive({ hamletId: null, rwNumber: null })
const rtForm = reactive({ rwKey: null, rtInput: '' })

/* ------------------------------------------------------------------ */
/* Mapping data backend -> tampilan                                    */
/* ------------------------------------------------------------------ */
function toHamletView(item) {
  const sourceRws =
    Array.isArray(item.rws) && item.rws.length > 0
      ? item.rws
      : (readLocalRws()[item.region_id] ?? [])

  const rws = sourceRws
    .map((rw) => {
      // Data lama: hanya nomor RT (angka) atau hanya rt_count
      const rawRts = Array.isArray(rw.rts)
        ? rw.rts
        : Array.from({ length: Number(rw.rt_count) || 0 }, (_, i) => i + 1)

      const byNumber = new Map()
      rawRts
        .map(normalizeRt)
        .filter((rt) => rt.rtNumber > 0)
        .forEach((rt) => byNumber.set(rt.rtNumber, rt))

      return {
        rwNumber: Number(rw.rw_number),
        rts: [...byNumber.values()].sort((a, b) => a.rtNumber - b.rtNumber),
      }
    })
    .sort((a, b) => a.rwNumber - b.rwNumber)

  return {
    id: item.region_id,
    name: item.name,
    headName: item.head_name ?? '',
    // angka tersimpan, hanya dipakai bila padukuhan belum punya data RT
    kkCount: item.kk_count ?? 0,
    population: item.population ?? 0,
    maleCount: item.male_count ?? 0,
    femaleCount: item.female_count ?? 0,
    rws,
  }
}

// source.rws berbentuk [{ rwNumber, rts: [{ rtNumber, kk, male, female }] }]
function buildPayload(source) {
  return {
    name: source.name.trim(),
    head_name: source.headName ?? '',
    rw_count: source.rws.length,
    rt_count: source.rws.reduce((sum, rw) => sum + rw.rts.length, 0),
    kk_count: source.kkCount ?? 0,
    population: source.population ?? 0,
    male_count: source.maleCount ?? 0,
    female_count: source.femaleCount ?? 0,
    rws: serializeRws(source.rws),
  }
}

async function loadRegions({ background = false } = {}) {
  try {
    const data = await getRegions()
    const normalized = Array.isArray(data) ? data : []
    setListCache('regions', normalized)
    hamlets.value = normalized.map(toHamletView)
    regionLoadError.value = ''
  } catch (error) {
    regionLoadError.value =
      'Data wilayah belum dapat dimuat. Pastikan backend aktif dan migration regions sudah dijalankan.'
    toast.add({
      severity: 'error',
      summary: 'Gagal memuat data wilayah',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 5000,
    })
    throw error
  } finally {
    if (!background) loadingRegions.value = false
  }
}

onMounted(async () => {
  try {
    await loadRegions({ background: Boolean(cachedRegions) })
  } catch {
    // error sudah ditangani di loadRegions
  }
})

const directionLabels = [
  { key: 'north', letter: 'U', label: 'Utara' },
  { key: 'south', letter: 'S', label: 'Selatan' },
  { key: 'east', letter: 'T', label: 'Timur' },
  { key: 'west', letter: 'B', label: 'Barat' },
]

/* ------------------------------------------------------------------ */
/* Struktur wilayah: Padukuhan -> RW -> RT                             */
/* ------------------------------------------------------------------ */
// null = mode tambah (semua padukuhan), id = mode edit satu padukuhan
const structureEditId = ref(null)
const isEditMode = computed(() => structureEditId.value !== null)

const visibleHamlets = computed(() =>
  isEditMode.value ? hamlets.value.filter((h) => h.id === structureEditId.value) : hamlets.value,
)

const hamletOptions = computed(() =>
  visibleHamlets.value.map((h) => ({ label: h.name, value: h.id })),
)

const rwRows = computed(() =>
  hamlets.value.flatMap((h) =>
    h.rws.map((rw) => ({
      key: `${h.id}:${rw.rwNumber}`,
      hamletId: h.id,
      hamletName: h.name,
      rwNumber: rw.rwNumber,
      totals: rwTotals(rw),
    })),
  ),
)

const visibleRwRows = computed(() =>
  isEditMode.value ? rwRows.value.filter((r) => r.hamletId === structureEditId.value) : rwRows.value,
)

const rwOptions = computed(() =>
  visibleRwRows.value.map((row) => ({
    label: `${rwLabel(row.rwNumber)} – ${row.hamletName}`,
    value: row.key,
  })),
)

const rtRows = computed(() =>
  hamlets.value.flatMap((h) =>
    h.rws.flatMap((rw) =>
      rw.rts.map((rt) => ({
        key: `${h.id}:${rw.rwNumber}:${rt.rtNumber}`,
        hamletId: h.id,
        hamletName: h.name,
        rwNumber: rw.rwNumber,
        rt,
      })),
    ),
  ),
)

const visibleRtRows = computed(() =>
  isEditMode.value ? rtRows.value.filter((r) => r.hamletId === structureEditId.value) : rtRows.value,
)

function warn(summary, detail) {
  toast.add({ severity: 'warn', summary, detail, life: 3500 })
}

function persistRws(hamlet) {
  writeLocalRws(hamlet.id, serializeRws(hamlet.rws))
}

function openStructureDialog(hamletId = null) {
  structureEditId.value = hamletId
  newHamletName.value = ''
  rwForm.rwNumber = null
  rtForm.rtInput = ''

  if (hamletId !== null) {
    rwForm.hamletId = hamletId
    const hamlet = hamlets.value.find((h) => h.id === hamletId)
    editingHamletId.value = hamletId
    hamletForm.name = hamlet?.name ?? ''
    rtForm.rwKey = hamlet?.rws.length ? `${hamletId}:${hamlet.rws[0].rwNumber}` : null
  } else {
    if (!hamlets.value.some((h) => h.id === rwForm.hamletId)) {
      rwForm.hamletId = hamlets.value[0]?.id ?? null
    }
    if (!rwOptions.value.some((o) => o.value === rtForm.rwKey)) {
      rtForm.rwKey = rwOptions.value[0]?.value ?? null
    }
  }
  structureDialogOpen.value = true
}

// 1) Padukuhan
async function addHamletQuick() {
  const name = newHamletName.value.trim()
  if (!name) return warn('Belum lengkap', 'Nama padukuhan wajib diisi')
  if (hamlets.value.some((h) => h.name.trim().toLowerCase() === name.toLowerCase())) {
    return warn('Sudah ada', `Padukuhan ${name} sudah terdaftar`)
  }

  addingHamlet.value = true
  try {
    const saved = await createRegion(buildPayload({ name, headName: '', rws: [] }))
    updateListCache('regions', (items) => [saved, ...items])
    hamlets.value.unshift(toHamletView(saved))
    currentPage.value = 0
    newHamletName.value = ''
    rwForm.hamletId = saved.region_id
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menambah padukuhan',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    addingHamlet.value = false
  }
}

async function deleteHamletFromDialog(h) {
  if (
    h.rws.length > 0 &&
    !window.confirm(`Hapus padukuhan ${h.name} beserta ${h.rws.length} RW di dalamnya?`)
  ) {
    return
  }
  await deleteHamlet(h.id)
  if (structureEditId.value === h.id) structureDialogOpen.value = false
  if (rwForm.hamletId === h.id) rwForm.hamletId = null
  if (String(rtForm.rwKey ?? '').startsWith(`${h.id}:`)) rtForm.rwKey = null
}

// 2) RW
function addRw() {
  const hamlet = hamlets.value.find((h) => h.id === rwForm.hamletId)
  if (!hamlet) return warn('Belum lengkap', 'Pilih padukuhan terlebih dahulu')

  const number = Number(rwForm.rwNumber)
  if (!Number.isInteger(number) || number < 1) {
    return warn('Belum lengkap', 'Isi nomor RW (angka minimal 1)')
  }
  if (hamlet.rws.some((rw) => rw.rwNumber === number)) {
    return warn('Sudah ada', `${rwLabel(number)} sudah ada di padukuhan ${hamlet.name}`)
  }

  hamlet.rws.push({ rwNumber: number, rts: [] })
  hamlet.rws.sort((a, b) => a.rwNumber - b.rwNumber)
  persistRws(hamlet)

  rtForm.rwKey = `${hamlet.id}:${number}`
  rwForm.rwNumber = number + 1
}

function removeRw(row) {
  const hamlet = hamlets.value.find((h) => h.id === row.hamletId)
  if (!hamlet) return
  if (
    row.totals.rtCount > 0 &&
    !window.confirm(`Hapus ${rwLabel(row.rwNumber)} beserta ${row.totals.rtCount} RT di dalamnya?`)
  ) {
    return
  }
  hamlet.rws = hamlet.rws.filter((rw) => rw.rwNumber !== row.rwNumber)
  persistRws(hamlet)
  if (rtForm.rwKey === row.key) rtForm.rwKey = null
}

// 3) RT: nomor boleh satu atau banyak ("1", "1-5", "6, 7, 9-10").
// KK, jiwa, dan jenis kelamin tidak diisi manual.
function addRt() {
  const row = rwRows.value.find((r) => r.key === rtForm.rwKey)
  if (!row) return warn('Belum lengkap', 'Pilih RW terlebih dahulu')

  const list = parseRtInput(rtForm.rtInput)
  if (list === null) {
    return warn('Format RT tidak valid', 'Contoh yang benar: 1, 1-5, atau 6, 7, 9-10')
  }
  if (list.length === 0) return warn('Belum lengkap', 'Isi nomor RT')

  const hamlet = hamlets.value.find((h) => h.id === row.hamletId)
  const rw = hamlet?.rws.find((item) => item.rwNumber === row.rwNumber)
  if (!rw) return

  const existing = new Set(rw.rts.map((rt) => rt.rtNumber))
  const fresh = list.filter((n) => !existing.has(n))
  if (fresh.length === 0) {
    return warn('Sudah ada', `${formatRtList(list)} sudah ada di ${rwLabel(rw.rwNumber)}`)
  }

  fresh.forEach((rtNumber) =>
    rw.rts.push({ rtNumber, kk: 0, male: 0, female: 0 }),
  )
  rw.rts.sort((a, b) => a.rtNumber - b.rtNumber)
  persistRws(hamlet)

  rtForm.rtInput = ''
}

function removeRt(row) {
  const hamlet = hamlets.value.find((h) => h.id === row.hamletId)
  const rw = hamlet?.rws.find((item) => item.rwNumber === row.rwNumber)
  if (!rw) return
  rw.rts = rw.rts.filter((rt) => rt.rtNumber !== row.rt.rtNumber)
  persistRws(hamlet)
}

/* ------------------------------------------------------------------ */
/* Edit detail padukuhan                                               */
/* ------------------------------------------------------------------ */
async function saveHamlet() {
  if (!hamletForm.name.trim()) {
    return warn('Belum lengkap', 'Nama padukuhan wajib diisi')
  }

  const editingId = editingHamletId.value
  const current = hamlets.value.find((h) => h.id === editingId)
  const name = hamletForm.name.trim()
  const payload = buildPayload({
    name,
    headName: current?.headName ?? '',
    kkCount: current?.kkCount,
    population: current?.population,
    maleCount: current?.maleCount,
    femaleCount: current?.femaleCount,
    rws: current?.rws ?? [],
  })

  savingHamlet.value = true
  try {
    const saved = await updateRegion(editingId, payload)

    writeLocalRws(editingId, payload.rws)
    updateListCache('regions', (items) =>
      items.map((item) => (item.region_id === editingId ? { ...item, ...saved } : item)),
    )
    hamlets.value = hamlets.value.map((item) =>
      item.id === editingId ? toHamletView({ ...saved, region_id: editingId }) : item,
    )

    hamletDialogOpen.value = false

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: `Padukuhan ${name} diperbarui`,
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menyimpan data',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  } finally {
    savingHamlet.value = false
  }
}

async function deleteHamlet(id) {
  const hamlet = hamlets.value.find((h) => h.id === id)
  try {
    await deleteRegion(id)
    removeLocalRws(id)
    hamlets.value = hamlets.value.filter((item) => item.id !== id)
    updateListCache('regions', (items) => items.filter((item) => item.region_id !== id))

    const maxFirst =
      Math.max(0, Math.ceil(hamlets.value.length / rowsPerPage.value) - 1) *
      rowsPerPage.value
    if (currentPage.value > maxFirst) currentPage.value = maxFirst

    toast.add({
      severity: 'success',
      summary: 'Berhasil',
      detail: `Padukuhan ${hamlet?.name ?? ''} dihapus`,
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Gagal menghapus data',
      detail: error.response?.data?.message ?? 'Periksa koneksi ke backend.',
      life: 4000,
    })
  }
}

/* ------------------------------------------------------------------ */
/* Excel: template & import                                            */
/* ------------------------------------------------------------------ */
function downloadExcelTemplate() {
  const headers = Object.keys(EXCEL_COLUMN_MAP)
  const exampleRows = [
    { 'Padukuhan': 'BALONG', 'RW': 1, 'RT': 1 },
    { 'Padukuhan': 'BALONG', 'RW': 1, 'RT': 2 },
    { 'Padukuhan': 'BALONG', 'RW': 2, 'RT': 6 },
    { 'Padukuhan': 'COKROGATEN', 'RW': 3, 'RT': 1 },
  ]

  const worksheet = XLSX.utils.json_to_sheet(exampleRows, { header: headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Wilayah')
  XLSX.writeFile(workbook, 'template-data-wilayah.xlsx')
}

function triggerExcelImport() {
  excelFileInput.value?.click()
}

async function handleExcelImport(event) {
  const file = event.target.files?.[0]
  if (!file) return

  importingExcel.value = true

  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'File kosong',
        detail: 'Tidak ada baris data yang terbaca dari file',
        life: 3000,
      })
      return
    }

    // Kelompokkan per padukuhan -> RW -> RT (satu baris = satu RT)
    const groups = new Map()
    const errors = []

    rows.forEach((row, index) => {
      const rowNumber = index + 2
      const mapped = {}
      for (const [excelHeader, fieldKey] of Object.entries(EXCEL_COLUMN_MAP)) {
        mapped[fieldKey] = row[excelHeader]
      }

      const name = String(mapped.name ?? '').trim()
      if (!name) {
        errors.push(`Baris ${rowNumber}: kolom "Padukuhan" kosong`)
        return
      }

      const rwNumber = Number(mapped.rwNumber)
      if (!Number.isInteger(rwNumber) || rwNumber < 1) {
        errors.push(`Baris ${rowNumber}: kolom "RW" harus berupa angka`)
        return
      }
      const rtNumber = Number(String(mapped.rtNumber).replace(/rt/gi, ''))
      if (!Number.isInteger(rtNumber) || rtNumber < 1) {
        errors.push(`Baris ${rowNumber}: kolom "RT" harus berupa satu angka (contoh: 3)`)
        return
      }

      const groupKey = name.toLowerCase()
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          name,
          headName: '',
          rws: [],
        })
      }

      const group = groups.get(groupKey)

      let rw = group.rws.find((item) => item.rwNumber === rwNumber)
      if (!rw) {
        rw = { rwNumber, rts: [] }
        group.rws.push(rw)
      }
      if (rw.rts.some((item) => item.rtNumber === rtNumber)) {
        errors.push(
          `Baris ${rowNumber}: ${rtLabel(rtNumber)} di ${rwLabel(rwNumber)} ${name} sudah ada, dilewati`,
        )
        return
      }

      rw.rts.push({ rtNumber, kk: 0, male: 0, female: 0 })
    })

    // Simpan setiap padukuhan ke backend
    let savedCount = 0
    for (const group of groups.values()) {
      try {
        const groupPayload = buildPayload(group)
        const saved = await createRegion(groupPayload)
        writeLocalRws(saved.region_id, groupPayload.rws)
        updateListCache('regions', (items) => [saved, ...items])
        hamlets.value.unshift(toHamletView(saved))
        savedCount++
      } catch (error) {
        errors.push(
          `${group.name}: ${error.response?.data?.message ?? 'gagal disimpan ke backend'}`,
        )
      }
    }

    if (savedCount > 0) currentPage.value = 0

    if (savedCount > 0 && errors.length === 0) {
      toast.add({
        severity: 'success',
        summary: 'Import berhasil',
        detail: `${savedCount} padukuhan ditambahkan`,
        life: 3500,
      })
    } else if (savedCount > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Import selesai dengan catatan',
        detail: `${savedCount} padukuhan masuk, ${errors.length} catatan: ${errors[0]}`,
        life: 6000,
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Import gagal',
        detail: errors[0] ?? 'Tidak ada baris valid. Periksa kolom Padukuhan, RW, dan RT',
        life: 6000,
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Gagal membaca file',
      detail: 'Pastikan file berformat .xlsx, .xls, atau .csv yang valid',
      life: 4000,
    })
  } finally {
    importingExcel.value = false
    event.target.value = ''
  }
}

/* ------------------------------------------------------------------ */
/* Batas wilayah                                                       */
/* ------------------------------------------------------------------ */
function openBoundaryDialog() {
  boundaryForm.north = boundaries.north
  boundaryForm.south = boundaries.south
  boundaryForm.east = boundaries.east
  boundaryForm.west = boundaries.west
  boundaryDialogOpen.value = true
}

function saveBoundaries() {
  Object.assign(boundaries, { ...boundaryForm })
  boundaryDialogOpen.value = false

  toast.add({
    severity: 'success',
    summary: 'Berhasil',
    detail: 'Batas wilayah diperbarui',
    life: 3000,
  })
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <h1 class="m-0 mb-1 text-[22px] font-bold text-slate-900">
      Data Wilayah Administratif Desa
    </h1>

    <p class="mb-5 text-sm text-slate-500">
      Kelola data wilayah desa: padukuhan, RW di setiap padukuhan, dan RT di setiap RW.
    </p>

    <div
      v-if="regionLoadError"
      class="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ regionLoadError }}
    </div>

    <div class="mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:gap-4 xl:grid-cols-4">
      <div
        v-for="s in areaStats"
        :key="s.label"
        class="relative overflow-hidden rounded-xl border border-neutral-200 bg-white p-3 sm:p-5"
      >
        <div class="mb-2 flex items-start justify-between gap-2 sm:mb-3">
          <p
            class="text-[11px] font-medium uppercase leading-tight tracking-wide text-neutral-500 sm:text-sm sm:font-normal sm:normal-case sm:tracking-normal"
          >
            {{ s.label }}
          </p>
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-md sm:h-11 sm:w-11 sm:rounded-xl"
            :class="s.bg"
          >
            <i :class="s.icon" class="text-sm sm:text-lg" />
          </div>
        </div>
        <p class="m-0 text-xl font-bold text-neutral-900 sm:text-3xl">
          {{ s.value }}
          <span class="text-xs font-medium text-neutral-400 sm:text-sm">{{ s.unit }}</span>
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 items-start gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
      <Card :pt="{ body: { class: '!p-3 sm:!p-5' } }">
        <template #content>
          <div class="flex flex-col gap-3 sm:gap-4">
            <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
              <Button
                label="Tambah Data"
                icon="pi pi-plus"
                class="w-full sm:w-auto"
                @click="openStructureDialog()"
              />

              <div class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <!-- Mobile: Template & Import berdampingan, masing-masing setengah lebar -->
                <div class="grid grid-cols-2 gap-2 sm:flex">
                  <Button
                    label="Template"
                    icon="pi pi-download"
                    severity="secondary"
                    outlined
                    class="w-full sm:w-auto"
                    @click="downloadExcelTemplate"
                  />

                  <Button
                    label="Import Excel"
                    icon="pi pi-upload"
                    severity="secondary"
                    outlined
                    class="w-full sm:w-auto"
                    :loading="importingExcel"
                    @click="triggerExcelImport"
                  />
                </div>

                <input
                  ref="excelFileInput"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  class="hidden"
                  @change="handleExcelImport"
                />

                <IconField class="w-full sm:w-auto">
                  <InputIcon class="pi pi-search" />

                  <InputText
                    v-model="filters.global.value"
                    placeholder="Cari padukuhan"
                    class="w-full"
                  />
                </IconField>
              </div>
            </div>

            <p class="m-0 text-xs text-slate-500">
              Klik baris padukuhan untuk melihat rincian RW dan RT.
            </p>

            <!--
              Tata letak kolom:
              - Padukuhan: lebar fleksibel 12rem - 20rem, nama panjang otomatis turun ke baris berikutnya.
              - KK / Jiwa / L / P / Aksi: lebar tetap & rapat.
              - Kolom kosong di paling kanan menampung sisa ruang, sehingga angka
                tidak tersebar jauh dari nama padukuhan.
            -->
            <DataTable
              v-model:filters="filters"
              v-model:first="currentPage"
              v-model:expandedRows="expandedRows"
              :value="hamlets"
              :loading="loadingRegions"
              dataKey="id"
              :paginator="true"
              :rows="rowsPerPage"
              :rowsPerPageOptions="[10, 25, 50]"
              :globalFilterFields="['name']"
              :rowClass="() => 'cursor-pointer'"
              :tableStyle="{ tableLayout: 'fixed', minWidth: '52rem' }"
              @row-click="(e) => toggleRow(e.data.id)"
              stripedRows
              currentPageReportTemplate="Menampilkan {first}–{last} dari {totalRecords} padukuhan"
              paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
              class="region-table w-full"
            >
              <template #empty>
                <div class="py-8 text-center text-slate-400">
                  Belum ada padukuhan, atau tidak ada yang cocok dengan pencarian.
                </div>
              </template>

              <Column style="width: 3rem">
                <template #body="{ data }">
                  <Button
                    :icon="expandedRows[data.id] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                    text
                    rounded
                    severity="secondary"
                    :aria-label="expandedRows[data.id] ? 'Tutup rincian' : 'Lihat rincian'"
                    @click.stop="toggleRow(data.id)"
                  />
                </template>
              </Column>

              <Column
                field="name"
                header="Padukuhan"
                sortable
                style="width: 16rem"
              >
                <template #body="{ data }">
                  <div class="break-words font-semibold text-slate-900">{{ data.name }}</div>
                </template>
              </Column>

              <Column header="RW" style="width: 4rem">
                <template #body="{ data }">{{ fmt(hamletTotals(data).rwCount) }}</template>
              </Column>

              <Column header="RT" style="width: 4rem">
                <template #body="{ data }">{{ fmt(hamletTotals(data).rtCount) }}</template>
              </Column>

              <Column header="KK" style="width: 4.5rem">
                <template #body="{ data }">{{ fmt(hamletTotals(data).kk) }}</template>
              </Column>

              <Column header="Jiwa" style="width: 4.5rem">
                <template #body="{ data }">{{ fmt(hamletTotals(data).population) }}</template>
              </Column>

              <Column header="L" style="width: 4rem">
                <template #body="{ data }">{{ fmt(hamletTotals(data).male) }}</template>
              </Column>

              <Column header="P" style="width: 4rem">
                <template #body="{ data }">{{ fmt(hamletTotals(data).female) }}</template>
              </Column>

              <Column header="Aksi" style="width: 8rem">
                <template #body="{ data }">
                  <div class="flex items-center gap-1" @click.stop>
                    <Button
                      icon="pi pi-pencil"
                      text
                      rounded
                      severity="secondary"
                      aria-label="Edit padukuhan"
                      title="Edit data wilayah"
                      @click="openStructureDialog(data.id)"
                    />

                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      severity="danger"
                      aria-label="Hapus padukuhan"
                      title="Hapus"
                      @click="deleteHamlet(data.id)"
                    />
                  </div>
                </template>
              </Column>

              <!-- Kolom penampung sisa ruang (tanpa lebar & tanpa isi) -->
              <Column />

              <!--
                Rincian: RW -> RT beserta total di setiap level.
                Lebar kolom disamakan dengan tabel utama (3rem + 16rem untuk kolom pertama,
                lalu RW 4 / RT 4 / KK 4.5 / Jiwa 4.5 / L 4 / P 4rem), sehingga KK, Jiwa, L, P tepat sejajar ke bawah.
              -->
              <template #expansion="{ data }">
                <div class="border-t border-slate-200 bg-white">
                  <p v-if="data.rws.length === 0" class="m-0 py-3 pl-16 pr-4 text-sm text-slate-500">
                    Belum ada RW. Klik ikon pensil di baris ini untuk menambahkannya.
                  </p>

                  <table v-else class="w-full table-fixed border-collapse text-left text-sm">
                    <colgroup>
                      <col style="width: 19rem" />
                      <col style="width: 4rem" />
                      <col style="width: 4rem" />
                      <col style="width: 4.5rem" />
                      <col style="width: 4.5rem" />
                      <col style="width: 4rem" />
                      <col style="width: 4rem" />
                      <col />
                    </colgroup>
                    <thead>
                      <tr class="bg-slate-100 text-xs text-slate-600">
                        <th class="py-2 pl-16 pr-4 font-medium">RW / RT</th>
                        <th />
                        <th />
                        <th class="px-4 py-2 font-medium">KK</th>
                        <th class="px-4 py-2 font-medium">Jiwa</th>
                        <th class="px-4 py-2 font-medium">L</th>
                        <th class="px-4 py-2 font-medium">P</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="rw in data.rws" :key="rw.rwNumber">
                        <tr class="border-t border-slate-200 bg-primary-50">
                          <td colspan="8" class="py-1.5 pl-16 pr-4 font-semibold text-primary-700">
                            {{ rwLabel(rw.rwNumber) }}
                            <span class="font-normal text-slate-500">· {{ rw.rts.length }} RT</span>
                          </td>
                        </tr>

                        <tr v-if="rw.rts.length === 0" class="border-t border-slate-100">
                          <td colspan="8" class="py-1.5 pl-20 pr-4 text-slate-400">Belum ada RT</td>
                        </tr>

                        <tr
                          v-for="rt in rw.rts"
                          :key="`${rw.rwNumber}-${rt.rtNumber}`"
                          class="border-t border-slate-100"
                        >
                          <td class="py-1.5 pl-20 pr-4 text-slate-800">{{ rtLabel(rt.rtNumber) }}</td>
                          <td colspan="2" />
                          <td class="px-4 py-1.5">{{ fmt(rt.kk) }}</td>
                          <td class="px-4 py-1.5">{{ fmt(rt.male + rt.female) }}</td>
                          <td class="px-4 py-1.5">{{ fmt(rt.male) }}</td>
                          <td class="px-4 py-1.5">{{ fmt(rt.female) }}</td>
                          <td />
                        </tr>

                        <tr
                          v-if="rw.rts.length > 0"
                          class="border-t border-slate-200 font-semibold text-slate-800"
                        >
                          <td class="py-1.5 pl-20 pr-4">Total {{ rwLabel(rw.rwNumber) }}</td>
                          <td colspan="2" />
                          <td class="px-4 py-1.5">{{ fmt(rwTotals(rw).kk) }}</td>
                          <td class="px-4 py-1.5">{{ fmt(rwTotals(rw).population) }}</td>
                          <td class="px-4 py-1.5">{{ fmt(rwTotals(rw).male) }}</td>
                          <td class="px-4 py-1.5">{{ fmt(rwTotals(rw).female) }}</td>
                          <td />
                        </tr>
                      </template>

                      <tr class="border-t-2 border-slate-300 bg-slate-100 font-bold text-slate-900">
                        <td class="break-words py-2 pl-16 pr-4">Total {{ data.name }}</td>
                        <td colspan="2" />
                        <td class="px-4 py-2">{{ fmt(hamletTotals(data).kk) }}</td>
                        <td class="px-4 py-2">{{ fmt(hamletTotals(data).population) }}</td>
                        <td class="px-4 py-2">{{ fmt(hamletTotals(data).male) }}</td>
                        <td class="px-4 py-2">{{ fmt(hamletTotals(data).female) }}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
            </DataTable>
          </div>
        </template>
      </Card>

      <div class="bg-primary-600 rounded-xl p-4 text-white shadow-md flex flex-col sm:p-5">
        <div class="flex items-center justify-between mb-4">
          <p class="text-sm font-semibold flex items-center gap-2">
            <i class="pi pi-compass text-base" />
            Batas Wilayah
          </p>

          <Button
            icon="pi pi-pencil"
            text
            rounded
            aria-label="Edit batas wilayah"
            title="Edit"
            class="!text-white hover:!bg-white/15 !w-8 !h-8"
            @click="openBoundaryDialog"
          />
        </div>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:flex xl:flex-col xl:gap-4">
          <div
            v-for="direction in directionLabels"
            :key="direction.key"
            class="flex items-start gap-3"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white"
            >
              {{ direction.letter }}
            </span>

            <div class="min-w-0">
              <p class="text-sm text-white font-medium">{{ direction.label }}</p>
              <p class="text-xs text-white/65 mt-0.5">
                {{ boundaries[direction.key] || 'Belum diisi' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog struktur wilayah: Padukuhan -> RW -> RT -->
    <Dialog
      v-model:visible="structureDialogOpen"
      modal
      :header="isEditMode ? 'Edit Data Wilayah' : 'Tambah Data Wilayah'"
      :style="{ width: '60rem', maxWidth: '95vw' }"
      :breakpoints="{ '640px': '95vw' }"
    >
      <div class="flex flex-col gap-4">
        <p class="m-0 text-sm text-slate-500">
          Tambahkan berurutan: padukuhan, lalu RW di dalam padukuhan, lalu RT di dalam RW. Jumlah KK,
          jiwa, dan jenis kelamin tidak perlu diisi manual. Setiap data langsung tersimpan.
        </p>

        <!-- 1. Padukuhan -->
        <section class="rounded-xl border border-slate-200 p-4">
          <h3 class="m-0 mb-3 text-sm font-bold text-slate-800">Padukuhan</h3>

          <div v-if="isEditMode" class="flex gap-2">
            <InputText
              v-model="hamletForm.name"
              placeholder="Nama padukuhan"
              class="min-w-0 flex-1"
              @keyup.enter="saveHamlet"
            />
            <Button
              label="Simpan Nama"
              :loading="savingHamlet"
              :disabled="savingHamlet"
              @click="saveHamlet"
            />
          </div>

          <div v-else class="flex gap-2">
            <InputText
              v-model="newHamletName"
              placeholder="Nama padukuhan"
              class="min-w-0 flex-1"
              @keyup.enter="addHamletQuick"
            />
            <Button label="Tambah" :loading="addingHamlet" @click="addHamletQuick" />
          </div>

          <div class="mt-3 max-h-56 overflow-auto">
            <table class="w-full border-collapse text-left text-sm">
              <thead>
                <tr class="text-xs text-slate-500">
                  <th class="py-2 pr-3 font-medium">Padukuhan</th>
                  <th class="py-2 pr-3 font-medium">RW</th>
                  <th class="py-2 pr-3 font-medium">RT</th>
                  <th class="py-2" />
                </tr>
              </thead>
              <tbody>
                <tr v-if="visibleHamlets.length === 0">
                  <td colspan="4" class="border-t border-slate-100 py-4 text-center text-slate-400">
                    Belum ada padukuhan. Tambahkan yang pertama di atas.
                  </td>
                </tr>
                <tr v-for="h in visibleHamlets" :key="h.id" class="border-t border-slate-100">
                  <td class="break-words py-2 pr-3 font-medium text-slate-800">{{ h.name }}</td>
                  <td class="py-2 pr-3">{{ hamletTotals(h).rwCount }}</td>
                  <td class="py-2 pr-3">{{ hamletTotals(h).rtCount }}</td>
                  <td class="py-2 text-right">
                    <Button
                      label="Hapus"
                      size="small"
                      severity="danger"
                      outlined
                      @click="deleteHamletFromDialog(h)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 2. RW -->
        <section class="rounded-xl border border-slate-200 p-4">
          <h3 class="m-0 mb-3 text-sm font-bold text-slate-800">RW</h3>

          <div class="flex flex-wrap gap-2">
            <Select
              v-model="rwForm.hamletId"
              :options="hamletOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih padukuhan"
              :disabled="isEditMode"
              class="min-w-[12rem] flex-1"
            />
            <InputNumber
              v-model="rwForm.rwNumber"
              :min="1"
              :useGrouping="false"
              placeholder="Nomor RW"
              class="w-36"
              inputClass="w-full"
              @keyup.enter="addRw"
            />
            <Button label="Tambah" @click="addRw" />
          </div>

          <div class="mt-3 max-h-56 overflow-auto">
            <table class="w-full border-collapse text-left text-sm">
              <thead>
                <tr class="text-xs text-slate-500">
                  <th class="py-2 pr-3 font-medium">RW</th>
                  <th class="py-2 pr-3 font-medium">Padukuhan</th>
                  <th class="py-2 pr-3 font-medium">RT</th>
                  <th class="py-2" />
                </tr>
              </thead>
              <tbody>
                <tr v-if="visibleRwRows.length === 0">
                  <td colspan="4" class="border-t border-slate-100 py-4 text-center text-slate-400">
                    Belum ada RW. Pilih padukuhan, isi nomor RW, lalu klik Tambah.
                  </td>
                </tr>
                <tr v-for="row in visibleRwRows" :key="row.key" class="border-t border-slate-100">
                  <td class="py-2 pr-3 font-medium text-slate-800">
                    {{ rwLabel(row.rwNumber) }}
                  </td>
                  <td class="break-words py-2 pr-3">{{ row.hamletName }}</td>
                  <td class="py-2 pr-3">{{ row.totals.rtCount }}</td>
                  <td class="py-2 text-right">
                    <Button
                      label="Hapus"
                      size="small"
                      severity="danger"
                      outlined
                      @click="removeRw(row)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- 3. RT -->
        <section class="rounded-xl border border-slate-200 p-4">
          <h3 class="m-0 mb-1 text-sm font-bold text-slate-800">RT</h3>
          <p class="m-0 mb-3 text-xs text-slate-500">
            Nomor RT bisa satu (1) atau banyak sekaligus (1-5 atau 6, 7, 9-10).
          </p>

          <div class="flex flex-wrap gap-2">
            <Select
              v-model="rtForm.rwKey"
              :options="rwOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Pilih RW"
              class="min-w-[12rem] flex-1"
            />
            <InputText
              v-model="rtForm.rtInput"
              placeholder="Nomor RT"
              class="w-32"
              @keyup.enter="addRt"
            />
            <Button label="Tambah" @click="addRt" />
          </div>

          <div class="mt-3 max-h-72 overflow-auto">
            <table class="w-full border-collapse text-left text-sm">
              <thead>
                <tr class="text-xs text-slate-500">
                  <th class="py-2 pr-3 font-medium">RT</th>
                  <th class="py-2 pr-3 font-medium">RW</th>
                  <th class="py-2 pr-3 font-medium">Padukuhan</th>
                  <th class="py-2" />
                </tr>
              </thead>
              <tbody>
                <tr v-if="visibleRtRows.length === 0">
                  <td colspan="4" class="border-t border-slate-100 py-4 text-center text-slate-400">
                    Belum ada RT. Pilih RW, isi nomor RT, lalu klik Tambah.
                  </td>
                </tr>
                <tr v-for="row in visibleRtRows" :key="row.key" class="border-t border-slate-100">
                  <td class="py-1.5 pr-3 font-medium text-slate-800">
                    {{ rtLabel(row.rt.rtNumber) }}
                  </td>
                  <td class="py-1.5 pr-3">{{ rwLabel(row.rwNumber) }}</td>
                  <td class="break-words py-1.5 pr-3">{{ row.hamletName }}</td>
                  <td class="py-1.5 text-right">
                    <Button
                      label="Hapus"
                      size="small"
                      severity="danger"
                      outlined
                      @click="removeRt(row)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <template #footer>
        <Button label="Selesai" @click="structureDialogOpen = false" />
      </template>
    </Dialog>

    <!-- Dialog batas wilayah -->
    <Dialog
      v-model:visible="boundaryDialogOpen"
      modal
      header="Edit Batas Wilayah"
      :style="{ width: '28rem' }"
    >
      <div class="flex flex-col gap-4">
        <div
          v-for="direction in directionLabels"
          :key="direction.key"
          class="flex flex-col gap-2"
        >
          <label class="text-sm font-semibold text-slate-700" :for="`boundary-${direction.key}`">
            {{ direction.label }}
          </label>
          <InputText
            :id="`boundary-${direction.key}`"
            v-model="boundaryForm[direction.key]"
            placeholder="Nama desa tetangga"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Batal"
          severity="secondary"
          outlined
          @click="boundaryDialogOpen = false"
        />
        <Button
          label="Simpan"
          @click="saveBoundaries"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Tabel rincian memenuhi lebar baris (tanpa padding sel expansion) supaya kolomnya sejajar */
.region-table :deep(.p-datatable-row-expansion > td) {
  padding: 0;
}
</style>