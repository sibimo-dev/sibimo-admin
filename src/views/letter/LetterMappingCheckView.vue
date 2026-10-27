<script setup>
/* Pemeriksa pemetaan field: membandingkan isian form SEMUA surat dengan field di backend (letter_type_fields)
   memakai pemetaan yang sama persis dengan saat surat dikirim (services/letter-create.service.js).
   Buka lewat  /letter/mapping-check . Hasil "Salin laporan" dikirim ke developer untuk mengisi override
   di data/letterFieldMap.js bila masih ada yang belum cocok. */
import { computed, reactive, ref } from 'vue'
import { LETTER_INDEX } from '@/data/letterIndex'
import { getBackendLetterCode } from '@/data/letterBackendMap'
import { getLetterTypes, getFields, createField } from '@/services/letter-type.service'
import { mapFieldsToBackend, fillFromDocuments } from '@/services/letter-create.service'

const letterModules = import.meta.glob('@/data/letters/*/*.js')
// field identitas pemohon dikirim sebagai applicant_*, bukan form_data -> tidak dianggap masalah
const IDENTITY = new Set(['name', 'nik', 'address', 'phone', 'whatsapp', 'fullName', 'phoneNumber', 'applicantName', 'applicantNik', 'applicantAddress', 'applicantPhone'])

const running = ref(false)
const done = ref(0)
const total = LETTER_INDEX.length
const rows = ref([])
const onlyProblems = ref(true)
const openSlug = ref('')
const globalError = ref('')
const copied = ref(false)

const problems = computed(() => rows.value.filter((r) => r.status !== 'ok'))
const shown = computed(() => (onlyProblems.value ? problems.value : rows.value))
const okCount = computed(() => rows.value.filter((r) => r.status === 'ok').length)

function metaOf(sections) {
  const map = {}
  for (const s of sections) for (const f of s.fields) map[f.key] = f.label
  return map
}
const defsOf = (sections) => Object.fromEntries(sections.flatMap((s) => s.fields).map((f) => [f.key, f]))
const snakeKey = (v) => String(v ?? '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').toLowerCase()
const bareOption = (o) => String(o && typeof o === 'object' ? (o.label ?? o.value) : o ?? '').replace(/^\s*\d+\s*[.)\-:]\s*/, '').trim()

async function checkOne(entry, types) {
  const [slug, group, , title, code] = entry
  const row = { slug, title, code: getBackendLetterCode(slug, code), status: 'ok', reqMissing: [], feUnmapped: [], beUnused: [], note: '', typeId: null, defs: {}, backendKeys: [] }
  try {
    const path = Object.keys(letterModules).find((p) => p.endsWith(`/${group}/${slug}.js`))
    if (!path) { row.status = 'error'; row.note = 'Berkas surat tidak ditemukan di frontend'; return row }
    const mod = await letterModules[path]()
    const sections = mod.sections ?? []
    const labels = metaOf(sections)
    const type = types.find((t) => String(t.letter_code ?? t.code ?? '').trim().toUpperCase() === String(row.code).trim().toUpperCase())
    if (!type) { row.status = 'notype'; row.note = `Kode ${row.code || '-'} belum terdaftar di backend`; return row }
    const backendFields = await getFields(type.letter_type_id ?? type.id)
    row.typeId = type.letter_type_id ?? type.id
    row.defs = defsOf(sections)
    row.backendKeys = backendFields.map((f) => String(f.field_key))
    row.maxSort = Math.max(0, ...backendFields.map((f) => Number(f.sort_order) || 0))
    const fields = Object.fromEntries(Object.keys(labels).map((k) => [k, 'x']))
    const mapped = mapFieldsToBackend(fields, backendFields, slug, labels)
    mapped.fields = fillFromDocuments(mapped.fields, backendFields, mod.documents ?? [], [])
    const hit = new Set(Object.keys(mapped.fields))
    row.reqMissing = backendFields.filter((f) => f.is_required && !hit.has(String(f.field_key))).map((f) => ({ key: f.field_key, label: f.field_label }))
    row.feUnmapped = mapped.unresolved.filter((k) => !IDENTITY.has(k)).map((k) => ({ key: k, label: labels[k] }))
    row.beUnused = backendFields.filter((f) => !hit.has(String(f.field_key))).map((f) => ({ key: f.field_key, label: f.field_label, required: Boolean(f.is_required) }))
    if (row.reqMissing.length) row.status = 'error'
    else if (row.feUnmapped.length || row.beUnused.length) row.status = 'warn'
  } catch (err) {
    row.status = 'error'
    row.note = err?.response?.data?.message || err?.message || 'Gagal memeriksa'
  }
  return row
}

async function run() {
  running.value = true; done.value = 0; rows.value = []; globalError.value = ''
  try {
    const types = await getLetterTypes()
    for (const entry of LETTER_INDEX) {
      rows.value.push(await checkOne(entry, types))
      done.value++
    }
  } catch (err) {
    globalError.value = err?.response?.data?.message || err?.message || 'Gagal memuat tipe surat dari backend'
  } finally { running.value = false }
}

/* Membuat field backend (letter_type_fields) untuk isian form yang belum punya pasangan. Field dibuat TIDAK wajib supaya
   pengajuan lama tidak terganggu; admin bisa mengubahnya di Kelola Tipe Surat. Isian berbentuk daftar baris (rows,
   mis. anggota keluarga) dilewati karena backend tidak punya tipe field itu. */
const creating = ref('')
const createReport = reactive({})
async function createMissing(r) {
  if (!r.typeId || creating.value) return
  const todo = r.feUnmapped.filter((f) => r.defs[f.key] && r.defs[f.key].type !== 'rows')
  const skippedRows = r.feUnmapped.filter((f) => r.defs[f.key]?.type === 'rows').map((f) => f.label)
  if (!todo.length) { createReport[r.slug] = { made: 0, skipped: [], rows: skippedRows, error: '' }; return }
  if (!window.confirm(`Buat ${todo.length} field baru di tipe surat \"${r.title}\" pada backend?\n\n` + todo.map((f) => `• ${f.label} (${snakeKey(f.key)})`).join('\n'))) return
  creating.value = r.slug
  const report = { made: 0, skipped: [], rows: skippedRows, error: '' }
  try {
    let sort = r.maxSort || 0
    for (const f of todo) {
      const def = r.defs[f.key]
      const field_key = snakeKey(f.key)
      if (r.backendKeys.includes(field_key)) { report.skipped.push(`${f.label} (${field_key} sudah ada tapi tidak cocok label)`); continue }
      const field_type = ['textarea', 'date', 'select'].includes(def.type) ? def.type : 'text'
      await createField(r.typeId, {
        field_label: def.label, field_key, field_type, is_required: false,
        options: field_type === 'select' ? (def.options ?? []).map(bareOption) : null,
        sort_order: ++sort,
      })
      report.made++
    }
    Object.assign(createReport, { [r.slug]: report })
    const types = await getLetterTypes()
    const fresh = await checkOne(LETTER_INDEX.find((e) => e[0] === r.slug), types)
    const i = rows.value.findIndex((x) => x.slug === r.slug)
    if (i >= 0) rows.value[i] = fresh
  } catch (err) {
    report.error = err?.response?.data?.message || err?.message || 'Gagal membuat field'
    Object.assign(createReport, { [r.slug]: report })
  } finally { creating.value = '' }
}

async function copyReport() {
  const report = problems.value.map((r) => ({
    slug: r.slug, title: r.title, code: r.code, status: r.status, note: r.note || undefined,
    backendRequiredTidakTerisi: r.reqMissing, formTidakTerpetakan: r.feUnmapped, fieldBackendTidakTerpakai: r.beUnused,
  }))
  try { await navigator.clipboard.writeText(JSON.stringify(report, null, 2)); copied.value = true; setTimeout(() => (copied.value = false), 2500) }
  catch { globalError.value = 'Tidak bisa menyalin otomatis. Pilih teks laporan di bawah lalu salin manual.' }
}

const badge = { ok: 'bg-emerald-100 text-emerald-700', warn: 'bg-amber-100 text-amber-700', error: 'bg-red-100 text-red-700', notype: 'bg-slate-200 text-slate-700' }
const badgeText = { ok: 'Cocok', warn: 'Perlu dicek', error: 'Gagal kirim', notype: 'Tipe belum ada' }
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-4">
    <div class="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
      <h1 class="text-lg font-semibold text-slate-800">Pemeriksa Pemetaan Field Surat</h1>
      <p class="mt-1 text-sm text-slate-500">
        Mencocokkan isian form {{ total }} surat dengan field di backend. <b>Gagal kirim</b> = ada field wajib backend yang tidak terisi
        dari form. <b>Perlu dicek</b> = ada isian form yang belum punya pasangan atau field backend yang tidak terpakai.
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <button class="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" :disabled="running" @click="run">
          {{ running ? `Memeriksa ${done}/${total}…` : rows.length ? 'Periksa ulang' : 'Periksa semua surat' }}
        </button>
        <label class="flex items-center gap-2 text-sm text-slate-600">
          <input v-model="onlyProblems" type="checkbox" /> Tampilkan yang bermasalah saja
        </label>
        <button v-if="problems.length" class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700" @click="copyReport">
          {{ copied ? 'Tersalin ✓' : 'Salin laporan (JSON)' }}
        </button>
      </div>
      <p v-if="globalError" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ globalError }}</p>
      <p v-if="rows.length" class="mt-3 text-sm text-slate-600">
        Cocok: <b>{{ okCount }}</b> · Bermasalah: <b>{{ problems.length }}</b> · Diperiksa: <b>{{ rows.length }}</b>/{{ total }}
      </p>
    </div>

    <div v-for="r in shown" :key="r.slug" class="rounded-xl bg-white border border-slate-200 shadow-sm">
      <button class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left" @click="openSlug = openSlug === r.slug ? '' : r.slug">
        <span class="min-w-0">
          <span class="block truncate text-sm font-semibold text-slate-800">{{ r.title }}</span>
          <span class="block truncate text-xs text-slate-500">{{ r.slug }} · kode {{ r.code || '-' }}</span>
        </span>
        <span class="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold" :class="badge[r.status]">{{ badgeText[r.status] }}</span>
      </button>
      <div v-if="openSlug === r.slug" class="space-y-3 border-t border-slate-100 px-4 py-3 text-sm">
        <p v-if="r.note" class="text-slate-600">{{ r.note }}</p>
        <div v-if="r.reqMissing.length">
          <p class="font-semibold text-red-700">Field wajib backend yang tidak terisi dari form:</p>
          <ul class="mt-1 list-disc pl-5 text-slate-700"><li v-for="f in r.reqMissing" :key="f.key"><b>{{ f.label }}</b> <code class="text-xs text-slate-500">({{ f.key }})</code></li></ul>
        </div>
        <div v-if="r.feUnmapped.length">
          <p class="font-semibold text-amber-700">Isian form yang belum punya pasangan di backend:</p>
          <ul class="mt-1 list-disc pl-5 text-slate-700"><li v-for="f in r.feUnmapped" :key="f.key"><b>{{ f.label }}</b> <code class="text-xs text-slate-500">({{ f.key }})</code></li></ul>
          <button
            v-if="r.typeId"
            class="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            :disabled="!!creating"
            @click="createMissing(r)"
          >
            {{ creating === r.slug ? 'Membuat field…' : 'Buat field backend yang belum ada' }}
          </button>
          <p v-if="createReport[r.slug]" class="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <template v-if="createReport[r.slug].error"><b class="text-red-700">Gagal:</b> {{ createReport[r.slug].error }}</template>
            <template v-else>Dibuat: <b>{{ createReport[r.slug].made }}</b> field.</template>
            <template v-if="createReport[r.slug].skipped.length"> Dilewati: {{ createReport[r.slug].skipped.join('; ') }}.</template>
            <template v-if="createReport[r.slug].rows.length"> Daftar baris tidak dibuat otomatis (buat/cek manual): {{ createReport[r.slug].rows.join(', ') }}.</template>
          </p>
        </div>
        <div v-if="r.beUnused.length">
          <p class="font-semibold text-slate-700">Field backend yang tidak menerima isian:</p>
          <ul class="mt-1 list-disc pl-5 text-slate-700"><li v-for="f in r.beUnused" :key="f.key"><b>{{ f.label }}</b> <code class="text-xs text-slate-500">({{ f.key }})</code><span v-if="f.required" class="ml-1 text-red-600">wajib</span></li></ul>
        </div>
      </div>
    </div>
    <p v-if="rows.length && !shown.length" class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Semua surat yang diperiksa sudah cocok.</p>
  </div>
</template>