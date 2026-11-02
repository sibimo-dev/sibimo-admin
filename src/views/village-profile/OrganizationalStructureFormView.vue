<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
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
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'

import {
  getOrganizationalStructures,
  saveOrganizationalStructure,
} from '@/services/profile.service'
import { mediaUrl } from '@/services/media'

const toast = useToast()
const confirm = useConfirm()
const saving = ref(false)
const loading = ref(false)

const JABATAN_OPTIONS = [
  { label: 'Lurah', level: 'Lurah', pimpinan: true },
  { label: 'Carik', level: 'Carik', pimpinan: true },
  { label: 'Kaur Danarta', level: 'Kepala Urusan (Sekretariat & Keuangan)' },
  { label: 'Kaur Tata Laksana', level: 'Kepala Urusan (Sekretariat & Keuangan)' },
  { label: 'Kaur Pangripta', level: 'Kepala Urusan (Sekretariat & Keuangan)' },
  { label: 'Kamituwa', level: 'Kepala Seksi' },
  { label: 'Ulu-Ulu', level: 'Kepala Seksi' },
  { label: 'Jagabaya', level: 'Kepala Seksi' },
  { label: 'Staff Pamong Kalurahan', level: 'Staff Pamong Kalurahan', slider: true, centerOnDesktop: true },
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
  { label: 'Ketua RT', level: 'Ketua RT & Ketua RW', slider: true },
  { label: 'Ketua RW', level: 'Ketua RT & Ketua RW', slider: true },
]

const JABATAN_KETUA_RT = 'Ketua RT'
const JABATAN_KETUA_RW = 'Ketua RW'
const JABATAN_DUKUH = 'Dukuh'
const DUKUH_LEVEL = 'Dukuh (Kepala Padukuhan)'

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

function photoSrc(value) {
  if (!value) return ''
  if (/^(data|blob):/i.test(String(value))) return value
  return mediaUrl(value)
}

function canonicalStaff(value) {
  return String(value ?? '').replace(/^\s*Staf(?=\s)/i, 'Staff')
}

function normalizeJabatan(title) {
  return canonicalStaff(
    String(title ?? '').replace(/\s+Kalurahan\s+Bimomartani\s*$/i, '').trim(),
  )
}

function jabatanKey(value) {
  return canonicalStaff(
    String(value ?? '').replace(/[\s\u00A0\u200B]+/g, ' ').trim(),
  ).toLowerCase()
}

function romanToNumber(value) {
  const numbers = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let total = 0
  let previous = 0
  for (const letter of String(value ?? '').toUpperCase().split('').reverse()) {
    const number = numbers[letter] ?? 0
    total += number < previous ? -number : number
    previous = Math.max(previous, number)
  }
  return total
}

function personOrderKey(item) {
  if (isDukuhLabel(item?.jabatan)) {
    const parsed = parseDukuhLabel(item.jabatan)
    const number = /^\d+$/.test(parsed.number) ? Number(parsed.number) : romanToNumber(parsed.number)
    return [9, number || 999]
  }

  const rank = JABATAN_OPTIONS.findIndex((option) => jabatanKey(option.label) === jabatanKey(item?.jabatan))
  return [rank < 0 ? 999 : rank, 0]
}

function compareAssignments(l, r) {
  const a = personOrderKey(l)
  const b = personOrderKey(r)
  return (
    a[0] - b[0]
    || a[1] - b[1]
    || String(l.padukuhan ?? '').localeCompare(String(r.padukuhan ?? ''), 'id')
    || (parseInt(l.rw_number, 10) || 0) - (parseInt(r.rw_number, 10) || 0)
    || (parseInt(l.rt_number, 10) || 0) - (parseInt(r.rt_number, 10) || 0)
    || startSortKey(r).localeCompare(startSortKey(l))
  )
}

function startSortKey(a) {
  return a?.start_date || (a?.start_year ? `${a.start_year}-01-01` : '')
}

function endSortKey(a) {
  return a?.end_date || (a?.end_year ? `${a.end_year}-12-31` : '')
}

function textValue(value) {
  if (value && typeof value === 'object') return value.value ?? value.label ?? ''
  return value ?? ''
}

function padNumber(value) {
  const v = String(value ?? '').trim()
  return /^\d+$/.test(v) ? v.padStart(2, '0') : v
}

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

function yearOf(date) {
  const year = parseInt(String(date ?? '').slice(0, 4), 10)
  return Number.isNaN(year) ? null : year
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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

function formatJabatanFormer(item) {
  if (item?.jabatan === JABATAN_KETUA_RT && item.rt_number) return `${item.jabatan} ${padNumber(item.rt_number)}`
  if (item?.jabatan === JABATAN_KETUA_RW && item.rw_number) return `${item.jabatan} ${padNumber(item.rw_number)}`
  return item?.jabatan ?? ''
}

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

function tingkatOf(jabatan) {
  const key = jabatanKey(jabatan)
  if (isDukuhLabel(jabatan)) return { label: 'Dukuh', severity: 'warn' }
  if (key === 'lurah' || key === 'carik') return { label: 'Pimpinan', severity: 'danger' }
  if (key.startsWith('kaur')) return { label: 'Kepala Urusan', severity: 'info' }
  if (['kamituwa', 'ulu-ulu', 'jagabaya'].includes(key)) return { label: 'Kepala Seksi', severity: 'success' }
  if (key.startsWith('staff')) return { label: 'Staff', severity: 'secondary' }
  if (key === 'ketua rt' || key === 'ketua rw') return { label: 'RT / RW', severity: 'contrast' }
  return { label: 'Lainnya', severity: 'secondary' }
}

const customJabatan = reactive([])

const allJabatanOptions = computed(() => {
  const seen = new Set()
  return [...JABATAN_OPTIONS, ...customJabatan].filter((option) => {
    const key = jabatanKey(option.label)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const form = reactive({
  organizational_structure_id: null,
  title: 'Struktur Organisasi Pemerintah Kalurahan',
  status: 'Published',
  published_at: null,
  persons: [],
  assignments: [],
  show_former_officials: false,
})

function emptyPerson() {
  return {
    id: uid(),
    staff_id: null,
    nama: '',
    gender: null,
    birth_date: '',
    education: null,
    major: '',
    school_name: '',
    graduation_year: null,
    photo: null,
    photoFile: null,
    signature: null,
    signatureFile: null,
  }
}

const PERSON_MERGE_KEYS = [
  'gender', 'birth_date', 'education', 'major', 'school_name', 'graduation_year', 'photo', 'signature',
]

function mergePersonData(person, src) {
  PERSON_MERGE_KEYS.forEach((key) => {
    const empty = person[key] === null || person[key] === undefined || person[key] === ''
    const has = src[key] !== null && src[key] !== undefined && src[key] !== ''
    if (empty && has) person[key] = src[key]
  })
}

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
    documentFile: null,
  }))
}

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

function deriveState(structure) {
  const persons = []
  const assignments = []
  const byStaff = new Map()
  const byName = new Map()
  const nameKey = (value) => String(value ?? '').replace(/\s+/g, ' ').trim().toLowerCase()

  function resolvePerson(src, name) {
    const staffId = src.staff_id ?? null
    const nKey = nameKey(name)
    let person = staffId !== null ? byStaff.get(staffId) : null

    if (!person && nKey) {
      const candidate = byName.get(nKey)
      if (candidate && (staffId === null || candidate.staff_id === null)) person = candidate
    }

    if (!person) {
      person = {
        ...emptyPerson(),
        id: staffId !== null ? `staff-${staffId}` : uid(),
        staff_id: staffId,
        nama: String(name ?? '').trim(),
      }
      persons.push(person)
    }

    if (staffId !== null) {
      if (person.staff_id === null) person.staff_id = staffId
      byStaff.set(staffId, person)
    }
    if (nKey && !byName.has(nKey)) byName.set(nKey, person)

    mergePersonData(person, src)
    return person
  }

  ;(structure.levels ?? []).forEach((level) => {
    ;(level.people ?? []).forEach((src) => {
      const person = resolvePerson(src, src.name)
      assignments.push({
        id: uid(),
        person_id: person.id,
        staff_id: src.staff_id ?? null,
        source: 'level',
        jabatan: normalizeJabatan(src.title) || null,
        desc: src.desc ?? '',
        rt_number: src.rt_number ?? '',
        rw_number: src.rw_number ?? '',
        padukuhan: textValue(src.padukuhan).trim(),
        start_date: src.start_date ?? '',
        end_date: src.end_date ?? '',
        start_year: src.start_year ?? null,
        end_year: src.end_year ?? null,
        term_end_date: src.term_end_date ?? '',
        sk_number: src.sk_number ?? '',
        sk_document: src.sk_document ?? null,
        sk_document_name:
          src.sk_document_name ??
          (src.sk_document ? String(src.sk_document).split('/').pop() : ''),
        skFile: null,
        position_history: seedHistory(src.position_history),
      })
    })
  })

  ;(structure.former_officials ?? []).forEach((src) => {
    const person = resolvePerson(src, src.nama)
    assignments.push({
      id: src.id ?? uid(),
      person_id: person.id,
      staff_id: src.staff_id ?? null,
      source: 'former',
      jabatan: canonicalStaff(src.jabatan ?? ''),
      desc: src.desc ?? '',
      rt_number: src.rt_number ?? '',
      rw_number: src.rw_number ?? '',
      padukuhan: src.padukuhan ?? '',
      start_date: src.start_date ?? '',
      end_date: src.end_date ?? '',
      start_year: src.start_year ?? null,
      end_year: src.end_year ?? null,
      term_end_date: '',
      sk_number: src.sk_number ?? '',
      sk_document: null,
      sk_document_name: '',
      skFile: null,
      position_history: seedHistory(src.position_history),
    })
  })

  return { persons, assignments }
}

function loadExisting(structure) {
  if (!structure) return

  const { persons, assignments } = deriveState(structure)
  Object.assign(form, {
    organizational_structure_id: structure.organizational_structure_id,
    title: structure.title ?? 'Struktur Organisasi Pemerintah Kalurahan',
    status: structure.status ?? 'Published',
    published_at: structure.published_at ?? null,
    persons,
    assignments,
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

const personMap = computed(() => new Map(form.persons.map((p) => [p.id, p])))

const assignmentsByPerson = computed(() => {
  const map = new Map()
  form.assignments.forEach((a) => {
    if (!map.has(a.person_id)) map.set(a.person_id, [])
    map.get(a.person_id).push(a)
  })
  return map
})

function isEnded(a) {
  if (a.end_date) return a.end_date < todayISO()
  return a.source === 'former'
}

const activeAssignments = computed(() => form.assignments.filter((a) => !isEnded(a)))
const endedAssignments = computed(() => form.assignments.filter((a) => isEnded(a)))

const personOptions = computed(() => (
  [...form.persons]
    .sort((l, r) => l.nama.localeCompare(r.nama, 'id'))
    .map((p) => ({ label: p.nama || '(tanpa nama)', value: p.id }))
))

const orderedPersons = computed(() => {
  const rank = (person) => {
    const active = (assignmentsByPerson.value.get(person.id) ?? []).filter((a) => !isEnded(a))
    if (!active.length) return [998, 0]
    return active.map(personOrderKey).sort((a, b) => a[0] - b[0] || a[1] - b[1])[0]
  }
  return [...form.persons].sort((l, r) => {
    const a = rank(l)
    const b = rank(r)
    return a[0] - b[0] || a[1] - b[1] || l.nama.localeCompare(r.nama, 'id')
  })
})

function currentJabatanLabels(person) {
  return (assignmentsByPerson.value.get(person.id) ?? [])
    .filter((a) => !isEnded(a))
    .sort(compareAssignments)
    .map(formatJabatanFormer)
}

function buildLevels() {
  const options = allJabatanOptions.value
  const order = []
  const levelMeta = new Map()

  options.forEach((option) => {
    if (!levelMeta.has(option.level)) {
      order.push(option.level)
      levelMeta.set(option.level, { pimpinan: false, slider: false, centerOnDesktop: false })
    }

    const meta = levelMeta.get(option.level)
    meta.pimpinan ||= !!option.pimpinan
    meta.slider ||= !!option.slider
    meta.centerOnDesktop ||= !!option.centerOnDesktop
  })
  const buckets = new Map(order.map((level) => [level, []]))

  activeAssignments.value.forEach((a) => {
    const person = personMap.value.get(a.person_id)
    if (!person || !a.jabatan || !person.nama.trim()) return

    const key = jabatanKey(a.jabatan)
    const option =
      options.find((item) => jabatanKey(item.label) === key) ??
      (isDukuhLabel(a.jabatan) ? options.find((item) => item.level === DUKUH_LEVEL) : null)
    if (!option) return

    const textOnly = a.jabatan === JABATAN_KETUA_RT || a.jabatan === JABATAN_KETUA_RW

    buckets.get(option.level).push({
      staff_id: a.staff_id ?? person.staff_id ?? null,
      name: person.nama.trim(),
      title: a.jabatan,
      desc: a.desc?.trim() ?? '',
      gender: person.gender ?? null,
      education: person.education ?? null,
      major: person.major?.trim() ?? '',
      school_name: person.school_name?.trim() ?? '',
      graduation_year: person.graduation_year ?? null,
      birth_date: person.birth_date ?? '',
      term_end_date: (a.start_date ? a.end_date : a.term_end_date) || null,
      position_history: (a.position_history ?? []).map((item, index) => ({
        sk: item.sk,
        date: item.date,
        official: item.official,

        document: item.documentFile ? `upload-sk:${a.id}-sk-${index}` : (item.document ?? null),
        document_name: item.document_name || null,
      })),
      start_date: a.start_date || null,
      end_date: a.end_date || null,
      start_year: a.start_year ?? null,
      end_year: a.end_year ?? null,
      photo: textOnly ? null : (person.photoFile ? `upload:${person.id}` : person.photo),
      signature: textOnly ? null : (person.signatureFile ? `upload-signature:${person.id}` : person.signature),
      rt_number: a.rt_number || '',
      rw_number: a.rw_number || '',
      padukuhan: textValue(a.padukuhan).trim(),
      sk_number: a.sk_number?.trim() ?? '',
      sk_document: a.skFile ? `upload-sk:${a.id}-sk-main` : (a.sk_document ?? null),
      sk_document_name: a.sk_document_name || null,
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

function buildFormerOfficials() {
  return endedAssignments.value.flatMap((a) => {
    const person = personMap.value.get(a.person_id)
    if (!person) return []
    return [{
      id: a.id,
      staff_id: a.staff_id ?? person.staff_id ?? null,
      jabatan: a.jabatan,
      nama: person.nama,
      rt_number: a.rt_number,
      rw_number: a.rw_number,
      padukuhan: a.padukuhan,
      start_year: a.start_year,
      end_year: a.end_year,
      start_date: a.start_date || null,
      end_date: a.end_date || null,
      desc: a.desc,
      gender: person.gender ?? null,
      birth_date: person.birth_date ?? '',
      education: person.education ?? null,
      major: person.major?.trim() ?? '',
      school_name: person.school_name?.trim() ?? '',
      graduation_year: person.graduation_year ?? null,
      sk_number: a.sk_number?.trim() ?? '',
      position_history: (a.position_history ?? []).map((h) => ({
        sk: h.sk,
        date: h.date,
        official: h.official,
      })),
    }]
  })
}

async function persistStructure() {
  saving.value = true
  try {

    const withoutAssignment = form.persons.filter((p) => !form.assignments.some((a) => a.person_id === p.id))

    const activeByPerson = new Map()
    activeAssignments.value.forEach((a) => {
      if (!activeByPerson.has(a.person_id)) activeByPerson.set(a.person_id, [])
      activeByPerson.get(a.person_id).push(a)
    })
    const carriesMedia = (person) => (activeByPerson.get(person.id) ?? []).some(
      (a) => a.jabatan !== JABATAN_KETUA_RT && a.jabatan !== JABATAN_KETUA_RW,
    )

    const files = [
      ...form.persons.flatMap((person) => (carriesMedia(person)
        ? [
            person.photoFile ? { token: person.id, file: person.photoFile } : null,
            person.signatureFile ? { token: person.id, file: person.signatureFile, type: 'signature' } : null,
          ]
        : [])),
      ...activeAssignments.value.map((a) => (
        a.skFile ? { token: `${a.id}-sk-main`, file: a.skFile, type: 'sk' } : null
      )),
      ...activeAssignments.value.flatMap((a) => (a.position_history ?? []).map((item, index) => (
        item.documentFile ? { token: `${a.id}-sk-${index}`, file: item.documentFile, type: 'sk' } : null
      ))),
    ].filter(Boolean)

    const saved = await saveOrganizationalStructure({
      id: form.organizational_structure_id,
      payload: {
        title: form.title,
        status: form.status,
        published_at: form.published_at,
        levels: buildLevels(),
        former_officials: buildFormerOfficials(),
        show_former_officials: form.show_former_officials,
      },
      files,
    })

    loadExisting(saved)
    withoutAssignment.forEach((p) => {
      if (!form.persons.some((x) => x.id === p.id)) form.persons.push(p)
    })
    return true
  } catch (error) {
    const validation = Object.values(error.response?.data?.errors ?? {})
      .flat()
      .filter(Boolean)
      .join(' ')
    toast.add({
      severity: 'error',
      summary: validation || error.response?.data?.message || 'Gagal menyimpan struktur organisasi',
      life: 3000,
    })
    return false
  } finally {
    saving.value = false
  }
}

async function commit(mutate, { remote = true } = {}) {
  const previous = { persons: form.persons, assignments: form.assignments }
  mutate()
  if (!remote) return true
  const ok = await persistStructure()
  if (!ok) {
    form.persons = previous.persons
    form.assignments = previous.assignments
  }
  return ok
}

const selectedPersons = ref([])

const personDialogVisible = ref(false)
const editingPersonId = ref(null)
const personDialogTitle = computed(() => (editingPersonId.value ? 'Edit Data Diri' : 'Tambah Pejabat / Staff'))

const emptyPersonForm = () => ({
  nama: '',
  gender: null,
  birth_date: '',
  education: null,
  major: '',
  school_name: '',
  graduation_year: null,
  photo: null,
  photoFile: null,
  signature: null,
  signatureFile: null,
})
const personForm = reactive(emptyPersonForm())

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

const showPersonMedia = computed(() => {
  if (!editingPersonId.value) return true
  const list = assignmentsByPerson.value.get(editingPersonId.value) ?? []
  return !(list.length && list.every((a) => a.jabatan === JABATAN_KETUA_RT || a.jabatan === JABATAN_KETUA_RW))
})

function openNewPerson() {
  editingPersonId.value = null
  Object.assign(personForm, emptyPersonForm())
  personSnapshot.value = serializePersonForm()
  personDialogVisible.value = true
}

function openEditPerson(person) {
  editingPersonId.value = person.id
  Object.assign(personForm, {
    nama: person.nama,
    gender: person.gender ?? null,
    birth_date: person.birth_date ?? '',
    education: person.education ?? null,
    major: person.major ?? '',
    school_name: person.school_name ?? '',
    graduation_year: person.graduation_year ?? null,
    photo: person.photo,
    photoFile: null,
    signature: person.signature,
    signatureFile: null,
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

async function savePersonDialog() {
  const nama = personForm.nama.trim()
  if (!nama) {
    toast.add({ severity: 'error', summary: 'Nama wajib diisi', life: 2500 })
    return
  }

  const wasEditing = !!editingPersonId.value
  const id = wasEditing ? editingPersonId.value : uid()

  const data = {
    nama,
    gender: personForm.gender,
    birth_date: personForm.birth_date,
    education: personForm.education,
    major: personForm.major.trim(),
    school_name: personForm.school_name.trim(),
    graduation_year: personForm.graduation_year,
    photo: personForm.photo,
    photoFile: personForm.photoFile,
    signature: personForm.signature,
    signatureFile: personForm.signatureFile,
  }

  if (wasEditing) {
    const hasAssignments = form.assignments.some((a) => a.person_id === id)
    const ok = await commit(() => {
      form.persons = form.persons.map((p) => (p.id === id ? { ...p, ...data } : p))
    }, { remote: hasAssignments })
    if (!ok) return
    closePersonDialog()
    toast.add({ severity: 'success', summary: 'Data diri diperbarui', life: 2500 })
    return
  }

  await commit(() => {
    form.persons = [...form.persons, { ...emptyPerson(), id, ...data }]
  }, { remote: false })

  closePersonDialog()
  if (!editingAssignmentId.value) {
    assignForm.person_id = id
    scrollToAssignForm()
  }
  toast.add({
    severity: 'success',
    summary: 'Data diri ditambahkan. Lengkapi jabatannya di Riwayat Jabatan agar tersimpan.',
    life: 4000,
  })
}

function deletePerson(person) {
  const count = (assignmentsByPerson.value.get(person.id) ?? []).length
  confirm.require({
    message: count
      ? `Hapus "${person.nama}" beserta ${count} riwayat jabatannya?`
      : `Hapus "${person.nama}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const ok = await commit(() => {
        form.persons = form.persons.filter((p) => p.id !== person.id)
        form.assignments = form.assignments.filter((a) => a.person_id !== person.id)
      }, { remote: count > 0 })
      if (!ok) return
      selectedPersons.value = selectedPersons.value.filter((p) => p.id !== person.id)
      if (assignForm.person_id === person.id) resetAssignForm()
      toast.add({ severity: 'success', summary: 'Data pejabat / staff dihapus', life: 2000 })
    },
  })
}

function deleteSelectedPersons() {
  if (!selectedPersons.value.length) return
  confirm.require({
    message: `Hapus ${selectedPersons.value.length} pejabat / staff terpilih beserta riwayat jabatannya?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const ids = new Set(selectedPersons.value.map((p) => p.id))
      const hadAssignments = form.assignments.some((a) => ids.has(a.person_id))
      const ok = await commit(() => {
        form.persons = form.persons.filter((p) => !ids.has(p.id))
        form.assignments = form.assignments.filter((a) => !ids.has(a.person_id))
      }, { remote: hadAssignments })
      if (!ok) return
      selectedPersons.value = []
      if (ids.has(assignForm.person_id)) resetAssignForm()
      toast.add({ severity: 'success', summary: 'Pejabat / staff terpilih dihapus', life: 2000 })
    },
  })
}

const personPhotoInput = ref(null)
const personSignatureInput = ref(null)

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

const assignSectionRef = ref(null)
const editingAssignmentId = ref(null)
const editingOriginal = ref(null)

const emptyAssignForm = () => ({
  person_id: null,
  jabatan: null,
  padukuhan: '',
  dukuh_number: '',
  rw_number: '',
  rt_number: '',
  start_date: todayISO(),
  end_date: '',
  desc: '',
  sk_number: '',
  sk_document: null,
  sk_document_name: '',
  skFile: null,
  position_history: [],
})
const assignForm = reactive(emptyAssignForm())

function scrollToAssignForm() {
  nextTick(() => assignSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

function resetAssignForm() {
  Object.assign(assignForm, emptyAssignForm())
  editingAssignmentId.value = null
  editingOriginal.value = null
}

const jabatanSelectOptions = computed(() => {
  const list = []
  const seen = new Set()
  const push = (label, value = label) => {
    const key = jabatanKey(value)
    if (!key || seen.has(key)) return
    seen.add(key)
    list.push({ label, value })
  }
  const special = (label) => isDukuhLabel(label) || label === JABATAN_KETUA_RT || label === JABATAN_KETUA_RW

  allJabatanOptions.value.forEach((option) => {
    if (!special(option.label)) push(option.label)
  })
  form.assignments.forEach((a) => {
    if (a.jabatan && !special(a.jabatan)) push(a.jabatan)
  })
  push('Ketua Dukuh', JABATAN_DUKUH)
  push('Ketua RW', JABATAN_KETUA_RW)
  push('Ketua RT', JABATAN_KETUA_RT)
  return list
})

const aIsRt = computed(() => assignForm.jabatan === JABATAN_KETUA_RT)
const aIsRw = computed(() => assignForm.jabatan === JABATAN_KETUA_RW)
const aIsRtRw = computed(() => aIsRt.value || aIsRw.value)
const aIsDukuh = computed(() => assignForm.jabatan === JABATAN_DUKUH)

const padukuhanDirectory = computed(() => {
  const map = new Map()
  const add = (label) => {
    if (!isDukuhLabel(label)) return
    const { number, name } = parseDukuhLabel(label)
    if (name && !map.has(name)) map.set(name, number)
  }
  allJabatanOptions.value.forEach((option) => add(option.label))
  form.assignments.forEach((a) => add(a.jabatan))
  return map
})

const padukuhanOptions = computed(() => {
  const names = new Set(padukuhanDirectory.value.keys())
  form.assignments.forEach((a) => {
    const name = String(textValue(a.padukuhan)).trim()
    if (name) names.add(name)
  })
  return [...names]
})

const aPadukuhanName = computed(() => String(textValue(assignForm.padukuhan)).trim())
const aKnownDukuhNumber = computed(() => padukuhanDirectory.value.get(aPadukuhanName.value) ?? null)
const aNeedsDukuhNumber = computed(() => (
  aIsDukuh.value && !!aPadukuhanName.value && aKnownDukuhNumber.value === null
))
const aDukuhNumber = computed(() => (
  String(aKnownDukuhNumber.value ?? assignForm.dukuh_number ?? '').trim().toUpperCase()
))
const aDukuhPreview = computed(() => (
  aIsDukuh.value && aPadukuhanName.value ? composeDukuhLabel(aDukuhNumber.value, aPadukuhanName.value) : ''
))

function sortedNumbers(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'id', { numeric: true }))
}

const sameText = (a, b) => jabatanKey(textValue(a)) === jabatanKey(textValue(b))

const rwOptions = computed(() => sortedNumbers(
  form.assignments
    .filter((a) => a.rw_number && sameText(a.padukuhan, aPadukuhanName.value))
    .map((a) => padNumber(a.rw_number)),
))

const rtOptions = computed(() => sortedNumbers(
  form.assignments
    .filter((a) => (
      a.rt_number
      && sameText(a.padukuhan, aPadukuhanName.value)
      && padNumber(a.rw_number) === padNumber(textValue(assignForm.rw_number))
    ))
    .map((a) => padNumber(a.rt_number)),
))

watch(
  () => assignForm.jabatan,
  (jabatan) => {
    const rt = jabatan === JABATAN_KETUA_RT
    const rw = jabatan === JABATAN_KETUA_RW
    const dukuh = jabatan === JABATAN_DUKUH
    if (!rt) assignForm.rt_number = ''
    if (!rt && !rw) assignForm.rw_number = ''
    if (!rt && !rw && !dukuh) assignForm.padukuhan = ''
    if (!dukuh) assignForm.dukuh_number = ''
  },
)

const willBePurna = computed(() => !!assignForm.end_date && assignForm.end_date < todayISO())

const assignLegacyYears = computed(() => {
  const o = editingOriginal.value
  return !assignForm.start_date && o && (o.start_year || o.end_year)
    ? formatMasaJabatan({ start_year: o.start_year, end_year: o.end_year })
    : ''
})
const assignLegacyTermEnd = computed(() => {
  const o = editingOriginal.value
  return o?.term_end_date && !assignForm.end_date ? formatDate(o.term_end_date, 'long') : ''
})

const editingPersonName = computed(() => personMap.value.get(assignForm.person_id)?.nama ?? '')

const skInputRef = ref(null)
let skTarget = null

function triggerSk(formObj, index = null) {
  skTarget = { formObj, index }
  skInputRef.value?.click()
}

function onSkPicked(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || !skTarget) return

  if (file.size > SK_MAX_SIZE_MB * 1024 * 1024) {
    toast.add({ severity: 'error', summary: `Ukuran dokumen maksimal ${SK_MAX_SIZE_MB} MB`, life: 2500 })
    return
  }

  const { formObj, index } = skTarget
  const baseName = file.name.replace(/\.[^.]+$/, '')
  if (index === null) {
    formObj.skFile = file
    formObj.sk_document_name = file.name
    if (!formObj.sk_number.trim()) formObj.sk_number = baseName
    return
  }

  const item = formObj.position_history[index]
  if (!item) return
  item.documentFile = file
  item.document_name = file.name
  item.sk = baseName
}

function removeMainSk(formObj) {
  formObj.skFile = null
  formObj.sk_document = null
  formObj.sk_document_name = ''
}

function addHistoryRow(formObj) {
  formObj.position_history.push({
    sk: '', date: '', official: '', document: null, document_name: '', documentFile: null,
  })
}

function removeHistoryRow(formObj, index) {
  formObj.position_history.splice(index, 1)
}

function hasSkDocument(item) {
  return !!(item?.documentFile || item?.document)
}

function removeHistoryDoc(formObj, index) {
  const item = formObj.position_history[index]
  if (!item) return
  item.documentFile = null
  item.document = null
  item.document_name = ''
  item.sk = ''
}

function startEditAssignment(a) {
  const dukuh = isDukuhLabel(a.jabatan)
  editingAssignmentId.value = a.id
  editingOriginal.value = a
  Object.assign(assignForm, {
    person_id: a.person_id,
    jabatan: dukuh ? JABATAN_DUKUH : a.jabatan,
    dukuh_number: dukuh ? parseDukuhLabel(a.jabatan).number : '',
    padukuhan: a.padukuhan || (dukuh ? parseDukuhLabel(a.jabatan).name : ''),
    rw_number: a.rw_number ?? '',
    rt_number: a.rt_number ?? '',
    start_date: a.start_date ?? '',
    end_date: a.end_date ?? '',
    desc: a.desc ?? '',
    sk_number: a.sk_number ?? '',
    sk_document: a.sk_document ?? null,
    sk_document_name: a.sk_document_name ?? '',
    skFile: null,
    position_history: seedHistory(a.position_history),
  })
  scrollToAssignForm()
}

function exclusiveKey(a) {
  const key = jabatanKey(a.jabatan)
  if (!key || key.startsWith('staff')) return null
  const area = jabatanKey(textValue(a.padukuhan))
  if (a.jabatan === JABATAN_KETUA_RT) return `rt|${area}|${padNumber(a.rw_number)}|${padNumber(a.rt_number)}`
  if (a.jabatan === JABATAN_KETUA_RW) return `rw|${area}|${padNumber(a.rw_number)}`
  return key
}

function prepareAssignment(f, person, original = null, editingId = null) {
  const isRt = f.jabatan === JABATAN_KETUA_RT
  const isRw = f.jabatan === JABATAN_KETUA_RW
  const isRtRw = isRt || isRw
  const isDukuh = f.jabatan === JABATAN_DUKUH

  const padukuhan = String(textValue(f.padukuhan)).trim()
  const rt = padNumber(textValue(f.rt_number))
  const rw = padNumber(textValue(f.rw_number))
  const knownNumber = padukuhanDirectory.value.get(padukuhan) ?? null
  const dukuhNumber = String(knownNumber ?? f.dukuh_number ?? '').trim().toUpperCase()

  if (isRt && (!padukuhan || !rw || !rt)) return { error: 'Padukuhan, nomor RW, dan nomor RT wajib diisi' }
  if (isRw && (!padukuhan || !rw)) return { error: 'Padukuhan dan nomor RW wajib diisi' }
  if (isDukuh) {
    if (!padukuhan) return { error: 'Padukuhan wajib dipilih' }
    if (dukuhNumber && !/^([IVXLCDM]+|\d+)$/.test(dukuhNumber)) {
      return { error: 'Nomor urut dukuh harus angka Romawi (mis. I, II, XIII)' }
    }
  }

  const usesDates = !!f.start_date
  if (!usesDates && !original?.start_year) return { error: 'Tanggal mulai wajib diisi' }
  if (f.end_date && !usesDates) return { error: 'Tanggal mulai wajib diisi jika tanggal akhir diisi' }
  if (usesDates && f.end_date && f.end_date < f.start_date) {
    return { error: 'Tanggal akhir tidak boleh lebih awal dari tanggal mulai' }
  }

  const history = (f.position_history ?? [])
    .map((h) => ({
      sk: (h.sk ?? '').trim(),
      date: h.date ?? '',
      official: (h.official ?? '').trim(),
      document: h.document ?? null,
      document_name: h.document_name ?? '',
      documentFile: h.documentFile ?? null,
    }))
    .filter((h) => h.sk || h.date || h.official || h.document || h.documentFile)

  const label = isDukuh ? composeDukuhLabel(dukuhNumber, padukuhan) : f.jabatan
  const sameOwner = original && original.person_id === person.id

  const entry = {
    person_id: person.id,
    staff_id: sameOwner ? (original.staff_id ?? person.staff_id ?? null) : (person.staff_id ?? null),
    jabatan: label,
    desc: (f.desc ?? '').trim(),
    rt_number: isRt ? rt : '',
    rw_number: isRtRw ? rw : '',
    padukuhan: isRtRw || isDukuh ? padukuhan : '',
    start_date: f.start_date || '',
    end_date: f.end_date || '',

    start_year: usesDates ? yearOf(f.start_date) : (original?.start_year ?? null),
    end_year: usesDates ? yearOf(f.end_date) : (original?.end_year ?? null),
    term_end_date: original?.term_end_date ?? '',
    source: usesDates ? null : (original?.source ?? null),
    position_history: history,
    sk_number: (f.sk_number ?? '').trim(),
    sk_document: f.sk_document ?? null,
    sk_document_name: f.sk_document_name ?? '',
    skFile: f.skFile ?? null,
  }
  const ended = isEnded(entry)

  if (!ended && !isDukuh && !isRtRw
    && !allJabatanOptions.value.some((o) => jabatanKey(o.label) === jabatanKey(label))) {
    return { error: `Jabatan "${label}" belum dikenal di struktur publik. Isi tanggal akhir atau pilih jabatan lain.` }
  }

  const key = exclusiveKey(entry)
  if (key && !ended) {
    const clash = form.assignments.find((a) => (
      a.id !== editingId && !isEnded(a) && exclusiveKey(a) === key
    ))
    if (clash) {
      const holder = personMap.value.get(clash.person_id)?.nama ?? 'pejabat lain'
      return {
        error: `${formatJabatanFormer(entry)} masih dijabat ${holder}. Isi tanggal akhir pada riwayat jabatan sebelumnya terlebih dahulu.`,
      }
    }
  }

  return { entry, ended }
}

async function saveAssignment() {
  const person = personMap.value.get(assignForm.person_id)
  if (!person) {
    toast.add({ severity: 'error', summary: 'Pilih pejabat / staff terlebih dahulu', life: 2500 })
    return
  }
  if (!assignForm.jabatan) {
    toast.add({ severity: 'error', summary: 'Pilih jabatan terlebih dahulu', life: 2500 })
    return
  }

  const editingId = editingAssignmentId.value
  const result = prepareAssignment({ ...assignForm }, person, editingOriginal.value, editingId)
  if (result.error) {
    toast.add({ severity: 'error', summary: result.error, life: 4500 })
    return
  }
  const { entry, ended } = result

  const ok = await commit(() => {
    form.assignments = editingId
      ? form.assignments.map((a) => (a.id === editingId ? { ...a, ...entry } : a))
      : [...form.assignments, { id: uid(), ...entry }]
  })
  if (!ok) return

  toast.add({
    severity: 'success',
    summary: editingId ? 'Riwayat jabatan diperbarui' : 'Riwayat jabatan disimpan',
    life: 2500,
  })
  if (ended && (entry.skFile || entry.sk_document)) {
    toast.add({
      severity: 'warn',
      summary: 'Dokumen SK tidak ikut tersimpan untuk pejabat purna (hanya nomor SK).',
      life: 4000,
    })
  }
  resetAssignForm()
}

const search = ref('')
const expandedRows = ref({})

const publicViewOptions = [
  { label: 'Struktur aktif saja', value: false },
  { label: 'Aktif + pejabat terdahulu', value: true },
]

function statusOf(person) {
  const list = assignmentsByPerson.value.get(person.id) ?? []
  if (!list.length) return { label: 'Belum ada jabatan · belum tersimpan', severity: 'warn', rank: 2 }
  return list.some((a) => !isEnded(a))
    ? { label: 'Aktif', severity: 'success', rank: 0 }
    : { label: 'Purna tugas', severity: 'secondary', rank: 1 }
}

function visibleAssignments(person) {
  const list = assignmentsByPerson.value.get(person.id) ?? []
  return [...list].sort((l, r) => (
    Number(isEnded(l)) - Number(isEnded(r))
    || (isEnded(l) ? endSortKey(r).localeCompare(endSortKey(l)) : 0)
    || compareAssignments(l, r)
  ))
}

const personRows = computed(() => {
  const keyword = search.value.trim().toLowerCase()
  return orderedPersons.value.map((person) => ({ ...person, status_rank: statusOf(person).rank })).filter((person) => {
    if (!keyword) return true
    const haystack = [
      person.nama,
      ...(assignmentsByPerson.value.get(person.id) ?? []).flatMap((a) => [
        formatJabatanFormer(a),
        a.jabatan,
        textValue(a.padukuhan),
        a.sk_number,
      ]),
    ]
    return haystack.some((value) => String(value ?? '').toLowerCase().includes(keyword))
  })
})

function expandAll() {
  expandedRows.value = Object.fromEntries(personRows.value.map((p) => [p.id, true]))
}

function collapseAll() {
  expandedRows.value = {}
}

function deleteAssignment(row) {
  const nama = personMap.value.get(row.person_id)?.nama ?? ''
  confirm.require({
    message: `Hapus riwayat jabatan "${formatJabatanFormer(row)}" milik "${nama}"?`,
    header: 'Konfirmasi Hapus',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Hapus',
    rejectLabel: 'Batal',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const ok = await commit(() => {
        form.assignments = form.assignments.filter((a) => a.id !== row.id)
      })
      if (!ok) return
      if (editingAssignmentId.value === row.id) resetAssignForm()
      toast.add({ severity: 'success', summary: 'Riwayat jabatan dihapus', life: 2000 })
    },
  })
}

async function onToggleShowFormer(value) {
  const previous = !value
  form.show_former_officials = value
  if (await persistStructure()) {
    toast.add({
      severity: 'success',
      summary: value
        ? 'Pejabat purna akan ditampilkan di halaman profil'
        : 'Pejabat purna disembunyikan dari halaman profil',
      life: 2500,
    })
  } else {
    form.show_former_officials = previous
  }
}

const previewDialogVisible = ref(false)
const previewPerson = ref(null)
const previewAssignment = ref(null)

function openPreviewPerson(person) {
  previewPerson.value = person
  previewAssignment.value = null
  previewDialogVisible.value = true
}

function openPreviewAssignment(row) {
  previewPerson.value = row.person ?? personMap.value.get(row.person_id) ?? null
  previewAssignment.value = row
  previewDialogVisible.value = true
}

function closePreview() {
  previewDialogVisible.value = false
  previewPerson.value = null
  previewAssignment.value = null
}

function editPersonFromPreview() {
  const person = previewPerson.value
  closePreview()
  if (person) openEditPerson(person)
}

function editAssignmentFromPreview() {
  const a = previewAssignment.value
  closePreview()
  if (a) startEditAssignment(a)
}

const previewChip = computed(() => {
  const a = previewAssignment.value
  if (a) return formatJabatanFormer(a)
  const labels = previewPerson.value ? currentJabatanLabels(previewPerson.value) : []
  return labels.length ? labels.join(' · ') : 'Pejabat / Staff'
})

const previewChipFull = computed(() => {
  const a = previewAssignment.value
  if (a) return `${formatJabatanFormer(a)} Kalurahan Bimomartani`
  const count = previewRiwayat.value.length
  return count ? `${count} riwayat jabatan` : 'Belum ada riwayat jabatan'
})

const previewRiwayat = computed(() => {
  const p = previewPerson.value
  if (!p) return []
  return [...(assignmentsByPerson.value.get(p.id) ?? [])]
    .sort((l, r) => startSortKey(r).localeCompare(startSortKey(l)))
})

const previewInfoCards = computed(() => {
  const p = previewPerson.value
  if (!p) return []
  const a = previewAssignment.value

  const cards = [
    { label: 'Jenis Kelamin', value: p.gender, icon: 'pi-user' },
    { label: 'Usia', value: calcAge(p.birth_date) !== null ? `${calcAge(p.birth_date)} tahun` : '', icon: 'pi-id-card' },
  ]

  if (a) {
    if (a.jabatan === JABATAN_KETUA_RT) cards.push({ label: 'Nomor RT', value: padNumber(a.rt_number), icon: 'pi-hashtag' })
    if (a.jabatan === JABATAN_KETUA_RT || a.jabatan === JABATAN_KETUA_RW) {
      cards.push({ label: 'Nomor RW', value: padNumber(a.rw_number), icon: 'pi-hashtag' })
      cards.push({ label: 'Padukuhan', value: a.padukuhan, icon: 'pi-map-marker' })
    } else if (isDukuhLabel(a.jabatan)) {
      cards.push({ label: 'Padukuhan', value: a.padukuhan || parseDukuhLabel(a.jabatan).name, icon: 'pi-map-marker' })
    }
  }

  cards.push(
    { label: 'Jenjang Pendidikan', value: p.education, icon: 'pi-book' },
    { label: 'Jurusan', value: p.major, icon: 'pi-bookmark' },
    {
      label: isHigherEducation(p.education) ? 'Nama Instansi Pendidikan' : 'Nama Sekolah',
      value: p.school_name,
      icon: 'pi-building',
    },
    { label: 'Tahun Lulus', value: p.graduation_year, icon: 'pi-graduation-cap' },
  )

  if (a) {
    const masa = formatMasaJabatan(a)
    cards.push({ label: 'Masa Jabatan', value: masa === '—' ? '' : masa, icon: 'pi-calendar' })
  }
  return cards
})
</script>

<template>
  <div class="min-h-full text-slate-800">
    <input ref="skInputRef" type="file" :accept="SK_ACCEPT" class="hidden" @change="onSkPicked" />

    <div class="mb-6">
      <h1 class="m-0 text-[22px] font-bold text-slate-800">Struktur Organisasi</h1>
      <p class="m-0 mt-1 text-sm text-slate-500">
        Kelola data diri pejabat / staff, riwayat jabatan, dan tampilan struktur Kalurahan.
      </p>
    </div>

    <Card>
      <template #title>
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">1</span>
            <span class="text-sm font-semibold text-slate-700">Data Pejabat / Staff &amp; Struktur Organisasi</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-medium text-slate-600">Tampilan di halaman publik:</span>
            <SelectButton
              :modelValue="form.show_former_officials"
              :options="publicViewOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
              :disabled="saving || loading"
              size="small"
              @update:modelValue="onToggleShowFormer"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2">
            <Button label="Tambah Pejabat / Staff" icon="pi pi-plus" size="small" @click="openNewPerson" />
            <Button
              label="Hapus"
              icon="pi pi-trash"
              size="small"
              severity="danger"
              outlined
              :disabled="!selectedPersons.length"
              @click="deleteSelectedPersons"
            />
          </div>

          <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <InputText v-model="search" placeholder="Cari nama / jabatan / padukuhan / SK" size="small" class="min-w-0 flex-1 sm:w-64 sm:flex-none" />
            <Button icon="pi pi-angle-double-down" size="small" text severity="secondary" title="Buka semua riwayat" aria-label="Buka semua riwayat" @click="expandAll" />
            <Button icon="pi pi-angle-double-up" size="small" text severity="secondary" title="Tutup semua riwayat" aria-label="Tutup semua riwayat" @click="collapseAll" />
          </div>
        </div>

        <DataTable
          v-model:selection="selectedPersons"
          v-model:expandedRows="expandedRows"
          removableSort
          :value="personRows"
          :loading="loading"
          dataKey="id"
          size="small"
          stripedRows
          :rows="10"
          paginator
          paginatorTemplate="PrevPageLink PageLinks NextPageLink"
        >
          <template #empty>
            <div class="py-6 text-center text-sm text-slate-400">
              {{ search
                ? 'Tidak ada hasil yang cocok.'
                : 'Belum ada data diri. Klik "Tambah Pejabat / Staff" untuk mulai.' }}
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem" />
          <Column expander headerStyle="width: 3rem" />

          <Column header="Foto" headerStyle="width: 4rem" headerClass="hidden sm:table-cell" bodyClass="hidden sm:table-cell">
            <template #body="{ data }">
              <Avatar
                :image="photoSrc(data.photo) || undefined"
                :label="!photoSrc(data.photo) ? initials(data.nama) : undefined"
                shape="circle"
                class="!bg-blue-100 !text-blue-700"
                :pt="{ image: { class: 'object-cover' } }"
              />
            </template>
          </Column>

          <Column field="nama" header="Nama">
            <template #body="{ data }">
              <div class="flex flex-col leading-snug">
                <span class="font-medium text-slate-800">{{ data.nama }}</span>
                <span class="text-xs text-slate-500 md:hidden">{{ currentJabatanLabels(data)[0] || '—' }}</span>
              </div>
            </template>
          </Column>

          <Column header="Jabatan Saat Ini" headerClass="hidden md:table-cell" bodyClass="hidden md:table-cell">
            <template #body="{ data }">
              <template v-if="currentJabatanLabels(data).length">
                <span class="text-slate-700">{{ currentJabatanLabels(data)[0] }}</span>
                <Tag
                  v-if="currentJabatanLabels(data).length > 1"
                  :value="`+${currentJabatanLabels(data).length - 1}`"
                  severity="secondary"
                  class="ml-1.5 !text-[10px]"
                />
              </template>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="education" header="Jenjang Pendidikan" headerClass="hidden lg:table-cell" bodyClass="hidden lg:table-cell">
            <template #body="{ data }">
              <div v-if="data.education" class="leading-snug">
                <span class="text-slate-700">{{ data.education }}</span>
                <span v-if="data.major" class="block text-xs text-slate-400">{{ data.major }}</span>
              </div>
              <span v-else class="text-slate-400">—</span>
            </template>
          </Column>

          <Column field="birth_date" header="Usia" headerStyle="width: 5rem" headerClass="hidden lg:table-cell" bodyClass="hidden lg:table-cell">
            <template #body="{ data }">
              <span class="whitespace-nowrap text-slate-600">{{ calcAge(data.birth_date) !== null ? `${calcAge(data.birth_date)} th` : '—' }}</span>
            </template>
          </Column>

          <Column header="Riwayat" headerStyle="width: 5.5rem" headerClass="hidden lg:table-cell" bodyClass="hidden lg:table-cell">
            <template #body="{ data }">
              <Tag :value="`${(assignmentsByPerson.get(data.id) ?? []).length} jabatan`" severity="info" class="!text-[10px]" />
            </template>
          </Column>

          <Column header="Status" field="status_rank" sortable headerStyle="width: 9rem">
            <template #body="{ data }">
              <Tag :value="statusOf(data).label" :severity="statusOf(data).severity" class="!whitespace-normal !text-[10px]" />
            </template>
          </Column>

          <Column header="Aksi" headerStyle="width: 8.5rem">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button icon="pi pi-eye" text rounded size="small" severity="secondary" @click="openPreviewPerson(data)" aria-label="Lihat detail" />
                <Button icon="pi pi-pencil" text rounded size="small" @click="openEditPerson(data)" aria-label="Edit data diri" />
                <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deletePerson(data)" aria-label="Hapus" />
              </div>
            </template>
          </Column>

          <template #expansion="{ data }">
            <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-2 sm:p-3">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <i class="pi pi-briefcase text-xs text-blue-600" />
                <span class="text-xs font-bold uppercase tracking-wider text-blue-700">Riwayat Jabatan · {{ data.nama }}</span>
              </div>

              <div
                v-if="!visibleAssignments(data).length"
                class="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-400"
              >
                {{ (assignmentsByPerson.get(data.id) ?? []).length
                  ? 'Tidak ada riwayat jabatan pada filter ini.'
                  : 'Belum ada riwayat jabatan. Tambahkan lewat form Riwayat Jabatan di bawah.' }}
              </div>

              <DataTable v-else :value="visibleAssignments(data)" dataKey="id" size="small" class="bg-white">
                <Column header="Jabatan">
                  <template #body="{ data: a }">
                    <div class="flex flex-col items-start gap-1 leading-snug">
                      <span class="font-medium text-slate-700">{{ formatJabatanFormer(a) || 'Belum dipilih' }}</span>
                      <span v-if="formatWilayahFormer(a) !== '—'" class="text-xs text-slate-500 md:hidden">{{ formatWilayahFormer(a) }}</span>
                      <Tag :value="tingkatOf(a.jabatan).label" :severity="tingkatOf(a.jabatan).severity" class="!text-[10px]" />
                    </div>
                  </template>
                </Column>

                <Column header="Wilayah" headerClass="hidden md:table-cell" bodyClass="hidden md:table-cell">
                  <template #body="{ data: a }">
                    <span class="whitespace-nowrap text-slate-600">{{ formatWilayahFormer(a) }}</span>
                  </template>
                </Column>

                <Column header="Masa Jabatan">
                  <template #body="{ data: a }">
                    <div class="flex flex-col items-start gap-1 leading-snug">
                      <span class="text-slate-600 md:whitespace-nowrap">{{ formatMasaJabatan(a) }}</span>
                      <Tag
                        :value="isEnded(a) ? 'Purna' : 'Aktif'"
                        :severity="isEnded(a) ? 'secondary' : 'success'"
                        class="!text-[10px]"
                      />
                    </div>
                  </template>
                </Column>

                <Column header="Nomor SK" headerClass="hidden md:table-cell" bodyClass="hidden md:table-cell">
                  <template #body="{ data: a }">
                    <span class="line-clamp-1 text-slate-500">{{ a.sk_number || '—' }}</span>
                  </template>
                </Column>

                <Column header="Aksi" headerStyle="width: 8.5rem">
                  <template #body="{ data: a }">
                    <div class="flex items-center gap-1">
                      <Button icon="pi pi-eye" text rounded size="small" severity="secondary" @click="openPreviewAssignment(a)" aria-label="Lihat detail" />
                      <Button icon="pi pi-pencil" text rounded size="small" @click="startEditAssignment(a)" aria-label="Edit riwayat jabatan" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="deleteAssignment(a)" aria-label="Hapus riwayat jabatan" />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </DataTable>
      </template>
    </Card>

    <Card class="mt-6">
      <template #title>
        <div class="flex items-center gap-2.5">
          <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">2</span>
          <span class="text-sm font-semibold text-slate-700">Riwayat Jabatan</span>
        </div>
      </template>
      <template #content>
        <div ref="assignSectionRef" class="flex flex-col gap-4">
          <div
            v-if="editingAssignmentId"
            class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            <span>
              <i class="pi pi-pencil mr-1.5 text-xs" />
              Mengubah riwayat jabatan <strong>{{ editingPersonName }}</strong>
            </span>
            <Button label="Batal" icon="pi pi-times" size="small" text severity="secondary" @click="resetAssignForm" />
          </div>

          <section class="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div class="mb-3 flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600"><i class="pi pi-user text-xs" /></span>
              <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Pejabat &amp; Jabatan</h3>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Pejabat / Staff</label>
                <Select
                  v-model="assignForm.person_id"
                  :options="personOptions"
                  optionLabel="label"
                  optionValue="value"
                  filter
                  placeholder="Pilih pejabat / staff"
                  fluid
                />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Jabatan</label>
                <Select
                  v-model="assignForm.jabatan"
                  :options="jabatanSelectOptions"
                  optionLabel="label"
                  optionValue="value"
                  filter
                  placeholder="Pilih jabatan"
                  fluid
                />
              </div>

              <div v-if="aIsDukuh || aIsRtRw" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Padukuhan</label>
                <Select
                  v-model="assignForm.padukuhan"
                  :options="padukuhanOptions"
                  editable
                  filter
                  placeholder="Pilih / ketik padukuhan"
                  fluid
                />
              </div>

              <div v-if="aNeedsDukuhNumber" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">No. Urut Dukuh</label>
                <InputText v-model="assignForm.dukuh_number" placeholder="mis. XIII" fluid />
              </div>

              <div v-if="aIsRtRw" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Nomor RW</label>
                <Select v-model="assignForm.rw_number" :options="rwOptions" editable placeholder="mis. 01" fluid />
              </div>

              <div v-if="aIsRt" class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Nomor RT</label>
                <Select v-model="assignForm.rt_number" :options="rtOptions" editable placeholder="mis. 01" fluid />
              </div>
            </div>

            <p v-if="aDukuhPreview" class="m-0 mt-3 text-xs text-slate-500">
              Jabatan akan tampil sebagai
              <strong class="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">{{ aDukuhPreview }}</strong>
            </p>
          </section>

          <section class="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div class="mb-3 flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600"><i class="pi pi-calendar text-xs" /></span>
              <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Masa Jabatan</h3>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Tanggal Mulai</label>
                <InputText v-model="assignForm.start_date" type="date" fluid />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">
                  Tanggal Akhir <span class="font-normal text-slate-400">(kosongkan jika masih menjabat)</span>
                </label>
                <InputText v-model="assignForm.end_date" type="date" :min="assignForm.start_date || undefined" fluid />
              </div>
            </div>

            <div v-if="willBePurna || assignLegacyYears || assignLegacyTermEnd" class="mt-3 flex flex-col gap-2">
              <div v-if="willBePurna" class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <i class="pi pi-info-circle mt-0.5" />
                <span>Tanggal akhir sudah lewat, jadi riwayat ini masuk daftar Purna Tugas. Dokumen SK tidak disimpan untuk pejabat purna (hanya nomor SK).</span>
              </div>
              <div v-if="assignLegacyYears" class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <i class="pi pi-info-circle mt-0.5" />
                <span>Data lama hanya berisi tahun ({{ assignLegacyYears }}). Isi tanggal lengkap untuk memperbarui.</span>
              </div>
              <div v-if="assignLegacyTermEnd" class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <i class="pi pi-info-circle mt-0.5" />
                <span>Data lama mencatat tanggal habis jabatan {{ assignLegacyTermEnd }}. Isi kolom Tanggal Akhir jika ingin menggantinya.</span>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div class="mb-3 flex items-center gap-2">
              <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600"><i class="pi pi-file text-xs" /></span>
              <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">
                Surat Keputusan &amp; Keterangan <span class="font-normal normal-case tracking-normal text-slate-400">(opsional)</span>
              </h3>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Nomor SK</label>
                <InputText v-model="assignForm.sk_number" placeholder="mis. 1/Kep.Lurah/2022" fluid />
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-xs font-semibold text-slate-600">Dokumen SK</label>
                <div
                  v-if="assignForm.skFile || assignForm.sk_document"
                  class="flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-1.5"
                >
                  <i class="pi pi-file text-blue-600" />
                  <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700" :title="assignForm.sk_document_name">
                    {{ assignForm.sk_document_name || 'Dokumen SK' }}
                  </span>
                  <Button label="Ganti" size="small" text :disabled="willBePurna" @click="triggerSk(assignForm)" />
                  <Button icon="pi pi-times" size="small" text rounded severity="danger" aria-label="Hapus dokumen" @click="removeMainSk(assignForm)" />
                </div>
                <div v-else class="flex items-center gap-3">
                  <Button label="Upload Dokumen" icon="pi pi-upload" size="small" outlined :disabled="willBePurna" @click="triggerSk(assignForm)" />
                  <small class="text-xs text-slate-400">PDF, Word, atau gambar (maks. {{ SK_MAX_SIZE_MB }} MB)</small>
                </div>
              </div>

              <div class="flex flex-col gap-1.5 md:col-span-2">
                <label class="text-xs font-semibold text-slate-600">Keterangan</label>
                <InputText v-model="assignForm.desc" placeholder="Deskripsi jabatan" fluid />
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600"><i class="pi pi-history text-xs" /></span>
                <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">
                  Riwayat SK <span class="font-normal normal-case tracking-normal text-slate-400">(opsional)</span>
                </h3>
              </div>
              <Button label="Tambah Riwayat SK" icon="pi pi-plus" size="small" outlined @click="addHistoryRow(assignForm)" />
            </div>

            <div
              v-if="!assignForm.position_history.length"
              class="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-400"
            >
              Belum ada riwayat SK.
            </div>

            <div class="flex flex-col gap-3">
              <div
                v-for="(item, index) in assignForm.position_history"
                :key="index"
                class="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div class="mb-2.5 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-500">SK #{{ index + 1 }}</span>
                  <Button icon="pi pi-trash" size="small" text rounded severity="danger" aria-label="Hapus riwayat SK" @click="removeHistoryRow(assignForm, index)" />
                </div>

                <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-slate-600">Judul / Nomor SK</label>
                    <InputText v-model="item.sk" placeholder="mis. 1/Kep.Lurah/2022" size="small" :readonly="hasSkDocument(item)" fluid />
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

                <div class="mt-3 flex flex-col gap-1.5">
                  <label class="text-xs font-semibold text-slate-600">Dokumen SK</label>
                  <div
                    v-if="hasSkDocument(item)"
                    class="flex items-center gap-2 rounded-lg border border-blue-100 bg-slate-50 px-3 py-2"
                  >
                    <i class="pi pi-file text-blue-600" />
                    <span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700" :title="item.document_name">
                      {{ item.document_name || 'Dokumen SK' }}
                    </span>
                    <span v-if="item.documentFile" class="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Belum disimpan
                    </span>
                    <Button label="Ganti" size="small" text :disabled="willBePurna" @click="triggerSk(assignForm, index)" />
                    <Button icon="pi pi-times" size="small" text rounded severity="danger" aria-label="Hapus dokumen" @click="removeHistoryDoc(assignForm, index)" />
                  </div>
                  <div v-else class="flex flex-wrap items-center gap-3">
                    <Button label="Upload Dokumen" icon="pi pi-upload" size="small" outlined :disabled="willBePurna" @click="triggerSk(assignForm, index)" />
                    <small class="text-xs text-slate-400">
                      PDF, Word, atau gambar (maks. {{ SK_MAX_SIZE_MB }} MB). Nama file menjadi judul SK.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            <p class="m-0 max-w-xl text-xs text-slate-500">
              Ketua dukuh cukup memilih padukuhan, ketua RW sampai RW, ketua RT sampai RT.
            </p>
            <div class="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
              <Button
                v-if="editingAssignmentId"
                label="Batal"
                text
                severity="secondary"
                :disabled="saving"
                @click="resetAssignForm"
              />
              <Button
                :label="editingAssignmentId ? 'Perbarui Riwayat Jabatan' : 'Simpan Riwayat Jabatan'"
                icon="pi pi-check"
                :loading="saving"
                @click="saveAssignment"
              />
            </div>
          </div>
        </div>
      </template>
    </Card>

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

      <div class="flex flex-col gap-5">
        <div
          v-if="!editingPersonId"
          class="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800"
        >
          <i class="pi pi-info-circle mt-0.5" />
          <span>Jabatan, masa jabatan, nomor SK, dan riwayat SK diisi di bagian Riwayat Jabatan setelah data diri ditambahkan.</span>
        </div>

        <section v-if="showPersonMedia" class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Foto &amp; Tanda Tangan</h3>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Foto</label>
            <div class="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 sm:flex-row sm:items-center">
              <div
                class="flex h-44 w-full cursor-pointer items-center justify-center overflow-hidden rounded bg-white hover:ring-1 hover:ring-blue-400 sm:flex-1"
                @click="triggerPersonPhotoUpload"
              >
                <img v-if="personForm.photo" :src="photoSrc(personForm.photo)" alt="Foto pejabat" class="h-full w-full object-contain" />
                <div v-else class="flex flex-col items-center gap-1.5 text-slate-400">
                  <i class="pi pi-camera text-2xl" />
                  <span class="text-xs font-medium">Belum ada foto</span>
                </div>
              </div>
              <div class="flex shrink-0 flex-row gap-1.5 sm:flex-col">
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
            <div class="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 sm:flex-row sm:items-center">
              <div class="flex h-20 w-full items-center justify-center overflow-hidden rounded bg-white sm:flex-1">
                <img v-if="personForm.signature" :src="photoSrc(personForm.signature)" alt="Tanda tangan digital" class="h-full w-full object-contain" />
                <span v-else class="text-xs text-slate-400">Belum ada tanda tangan</span>
              </div>
              <div class="flex shrink-0 flex-row gap-1.5 sm:flex-col">
                <Button label="Upload" icon="pi pi-upload" size="small" outlined @click="triggerPersonSignatureUpload" />
                <Button v-if="personForm.signature" label="Hapus" icon="pi pi-trash" size="small" text severity="danger" @click="removePersonSignature" />
              </div>
            </div>
            <small class="text-xs text-slate-400">Otomatis dinormalisasi ke PNG transparan 600 × 220 px.</small>
          </div>

          <small class="text-xs text-slate-400">
            Foto &amp; tanda tangan hanya tersimpan untuk pejabat yang masih aktif.
          </small>
        </section>

        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Data Diri</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5 sm:col-span-2">
              <label class="text-[13px] font-semibold text-slate-700">Nama</label>
              <InputText v-model="personForm.nama" placeholder="Nama lengkap" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Jenis Kelamin</label>
              <Select v-model="personForm.gender" :options="GENDER_OPTIONS" placeholder="Pilih jenis kelamin" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-semibold text-slate-700">Tanggal Lahir</label>
              <InputText v-model="personForm.birth_date" type="date" fluid />
            </div>
          </div>
        </section>

        <section class="flex flex-col gap-3">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Riwayat Pendidikan</h3>

          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" text severity="secondary" :disabled="saving" @click="closePersonDialog" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="savePersonDialog" />
      </template>
    </Dialog>

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
        footer: { class: '!flex-wrap !border-t !border-slate-100 !pt-3' },
      }"
      @hide="closePreview"
    >
      <div v-if="previewPerson" class="relative pb-6">
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
            {{ previewChip }}
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
            {{ previewChipFull }}
          </span>

          <p v-if="previewAssignment?.desc" class="m-0 mt-3 text-sm text-slate-500">{{ previewAssignment.desc }}</p>
        </div>

        <div class="relative z-10 mt-6 flex flex-col gap-6 px-6">
          <section class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="h-px w-6 bg-blue-600" />
              <h3 class="m-0 text-xs font-bold uppercase tracking-widest text-blue-700">Informasi Pejabat</h3>
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

            <div
              v-if="previewAssignment"
              class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <i class="pi pi-clock" />
              </span>
              <div>
                <p class="m-0 text-[11px] font-bold uppercase tracking-wider text-amber-700">Tanggal Habis Jabatan</p>
                <p class="m-0 text-sm font-semibold text-slate-700">
                  {{ formatDate(previewAssignment.end_date || previewAssignment.term_end_date, 'long') || '—' }}
                </p>
              </div>
            </div>
          </section>

          <section v-if="previewAssignment" class="flex flex-col gap-3">
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
                <p class="m-0 break-words text-sm font-semibold text-slate-700">{{ previewAssignment.sk_number || '—' }}</p>
                <p v-if="previewAssignment.sk_document_name" class="m-0 truncate text-xs text-slate-400" :title="previewAssignment.sk_document_name">
                  {{ previewAssignment.sk_document_name }}
                </p>
              </div>
              <a
                v-if="previewAssignment.sk_document"
                :href="photoSrc(previewAssignment.sk_document)"
                target="_blank"
                rel="noopener"
                class="shrink-0 text-xs font-semibold text-blue-600 hover:underline"
              >
                Buka dokumen
              </a>
            </div>
          </section>

          <section v-if="previewAssignment?.position_history?.length" class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="h-px w-6 bg-blue-600" />
              <h3 class="m-0 text-xs font-bold uppercase tracking-widest text-blue-700">Riwayat SK</h3>
            </div>

            <ul class="m-0 flex list-none flex-col gap-2 p-0">
              <li
                v-for="(item, index) in previewAssignment.position_history"
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

          <section class="flex flex-col gap-3">
            <div class="flex items-center gap-3">
              <span class="h-px w-6 bg-blue-600" />
              <h3 class="m-0 text-xs font-bold uppercase tracking-widest text-blue-700">Riwayat Jabatan</h3>
            </div>

            <div
              v-if="!previewRiwayat.length"
              class="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-center text-sm text-slate-400"
            >
              Belum ada riwayat jabatan.
            </div>

            <ul v-else class="m-0 flex list-none flex-col gap-2 p-0">
              <li
                v-for="item in previewRiwayat"
                :key="item.id"
                :class="[
                  'flex items-start gap-3 rounded-xl border p-3 text-sm text-slate-700',
                  previewAssignment && previewAssignment.id === item.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-slate-200 bg-slate-50',
                ]"
              >
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <i class="pi pi-briefcase text-sm" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="m-0 font-semibold">{{ formatJabatanFormer(item) }}</p>
                  <p class="m-0 text-xs text-slate-500">
                    {{ formatWilayahFormer(item) !== '—' ? `${formatWilayahFormer(item)} · ` : '' }}{{ formatMasaJabatan(item) }}
                  </p>
                </div>
                <Tag
                  :value="isEnded(item) ? 'Purna' : 'Aktif'"
                  :severity="isEnded(item) ? 'secondary' : 'success'"
                  class="!text-[10px]"
                />
              </li>
            </ul>
          </section>
        </div>
      </div>

      <template #footer>
        <Button label="Tutup" icon="pi pi-times" text severity="secondary" @click="closePreview" />
        <Button label="Edit Data Diri" icon="pi pi-user-edit" text @click="editPersonFromPreview" />
        <Button v-if="previewAssignment" label="Edit Jabatan" icon="pi pi-pencil" @click="editAssignmentFromPreview" />
      </template>
    </Dialog>
  </div>
</template>