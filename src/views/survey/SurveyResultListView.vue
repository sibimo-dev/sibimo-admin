<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import * as XLSX from 'xlsx'
import Card from 'primevue/card'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import SurveyElementBars from '@/components/survey/SurveyElementBars.vue'
import { getAdminSurveyResults } from '@/services/survey.service'
import {
  SURVEY_ELEMENTS,
  SERVICE_TYPES,
  averageToIkm,
  getIkmGrade,
  getSatisfiedPercent,
  buildEvaluation,
  formatNumber,
} from '@/data/survey'

const loading = ref(true)
const loadError = ref('')
const results = ref(null)

const periodOptions = [
  { label: 'Semua waktu', value: 'all' },
  { label: '30 hari terakhir', value: '30' },
  { label: '90 hari terakhir', value: '90' },
  { label: '1 tahun terakhir', value: '365' },
]
const period = ref('all')
const serviceFilter = ref(null)
const serviceOptions = [{ label: 'Semua layanan', value: null }, ...SERVICE_TYPES.map(item => ({ label: item, value: item }))]

async function fetchResults() {
  loading.value = true
  loadError.value = ''
  try {
    results.value = await getAdminSurveyResults({
      period: period.value,
      service_type: serviceFilter.value || undefined,
    })
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Gagal memuat hasil survei.'
    results.value = null
  } finally {
    loading.value = false
  }
}

onMounted(fetchResults)
watch([period, serviceFilter], fetchResults)

// ---------- Derived values ----------
const totalResponses = computed(() => Number(results.value?.total_responses ?? 0))
const elements = computed(() => results.value?.elements ?? [])
const ikmScore = computed(() => averageToIkm(results.value?.average_score))
const ikmGrade = computed(() => getIkmGrade(ikmScore.value))
const satisfiedPercent = computed(() => getSatisfiedPercent(elements.value))
const evaluation = computed(() => buildEvaluation(elements.value))

const rankedElements = computed(() =>
  SURVEY_ELEMENTS
    .map(definition => ({
      title: definition.title,
      average: Number(elements.value.find(element => element.key === definition.key)?.average ?? 0),
    }))
    .filter(item => item.average > 0)
    .sort((a, b) => a.average - b.average),
)
const lowestElement = computed(() => rankedElements.value[0] ?? null)
const highestElement = computed(() => rankedElements.value[rankedElements.value.length - 1] ?? null)

const breakdowns = computed(() => [
  { title: 'Per jenis layanan', items: results.value?.by_service ?? [] },
  { title: 'Per jenis kelamin', items: results.value?.by_gender ?? [] },
  { title: 'Per kelompok umur', items: results.value?.by_age_group ?? [] },
  { title: 'Per pendidikan', items: results.value?.by_education ?? [] },
  { title: 'Per pekerjaan', items: results.value?.by_occupation ?? [] },
])

function maxCount(items) {
  return Math.max(1, ...items.map(item => Number(item.count ?? 0)))
}

const trend = computed(() => results.value?.trend ?? [])
const trendMaxCount = computed(() => maxCount(trend.value))

function formatMonth(month) {
  return new Date(`${month}-01`).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
}

function formatDateTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const responses = computed(() => results.value?.responses ?? [])
const suggestions = computed(() => responses.value.filter(item => item.suggestion).slice(0, 20))

// ---------- Export ----------
function exportToExcel() {
  const header = [
    'Tanggal', 'Jenis Layanan', 'Umur', 'Jenis Kelamin', 'Pendidikan', 'Pekerjaan',
    ...SURVEY_ELEMENTS.map(element => element.title),
    'Rata-rata', 'Saran',
  ]
  const rows = responses.value.map(item => [
    formatDateTime(item.created_at),
    item.service_type,
    item.age,
    item.gender,
    item.education,
    item.occupation,
    ...SURVEY_ELEMENTS.map(element => item.answers?.[element.key] ?? ''),
    item.average_score,
    item.suggestion ?? '',
  ])

  const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows])
  worksheet['!cols'] = header.map(label => ({ wch: Math.min(Math.max(label.length + 3, 12), 30) }))
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Survei')
  XLSX.writeFile(workbook, `Hasil-Survei-Kepuasan-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<template>
  <div>

    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="m-0 text-2xl font-bold text-primary-900">Hasil Survei Kepuasan</h1>
        <p class="m-0 mt-1 text-sm text-neutral-500">
          Pantau Indeks Kepuasan Masyarakat (IKM) dan temukan layanan yang perlu dievaluasi.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Select v-model="period" :options="periodOptions" optionLabel="label" optionValue="value" class="w-44 text-[13px]" />
        <Select v-model="serviceFilter" :options="serviceOptions" optionLabel="label" optionValue="value" class="w-60 text-[13px]" />
        <Button
          label="Export Excel"
          icon="pi pi-file-excel"
          severity="secondary"
          outlined
          :disabled="!responses.length"
          class="rounded-lg border border-neutral-300 bg-white px-3.5 py-2 text-[13px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
          @click="exportToExcel"
        />
      </div>
    </div>

    <Message v-if="loadError" severity="error" :closable="false" class="mb-4 text-[13px]">{{ loadError }}</Message>

    <div v-if="loading" class="rounded-lg border border-neutral-200 bg-white px-6 py-12 text-center text-[13px] text-neutral-400">
      Memuat hasil survei...
    </div>

    <div
      v-else-if="results && totalResponses === 0"
      class="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-[13px] text-neutral-500"
    >
      Belum ada responden pada filter ini.
    </div>

    <div v-else-if="results" class="flex flex-col gap-6">

      <!-- ============ SUMMARY CARDS ============ -->
      <div class="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <div class="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4">
          <span class="text-[12px] text-neutral-500">Total responden</span>
          <span class="text-2xl font-bold text-neutral-900">{{ formatNumber(totalResponses, 0) }}</span>
        </div>

        <div class="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4">
          <span class="text-[12px] text-neutral-500">Nilai IKM (25–100)</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-bold" :class="ikmGrade.text">{{ formatNumber(ikmScore, 2) }}</span>
            <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="ikmGrade.badge">
              {{ ikmGrade.grade }} · {{ ikmGrade.label }}
            </span>
          </div>
          <span class="text-[11px] text-neutral-400">Rata-rata {{ formatNumber(results.average_score) }} dari 4</span>
        </div>

        <div class="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4">
          <span class="text-[12px] text-neutral-500">Tingkat kepuasan</span>
          <span class="text-2xl font-bold text-neutral-900">{{ formatNumber(satisfiedPercent, 1) }}%</span>
          <span class="text-[11px] text-neutral-400">Jawaban bernilai puas / sangat puas</span>
        </div>

        <div class="flex flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-4">
          <span class="text-[12px] text-neutral-500">Unsur terendah</span>
          <span class="text-base font-bold text-red-600">{{ lowestElement?.title ?? '-' }}</span>
          <span class="text-[11px] text-neutral-400">
            Tertinggi: {{ highestElement?.title ?? '-' }}
            <template v-if="highestElement">({{ formatNumber(highestElement.average) }})</template>
          </span>
        </div>
      </div>

      <!-- ============ EVALUATION ============ -->
      <Card
        :pt="{
          root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
          body: { class: 'p-5' },
          content: { class: 'p-0' },
        }"
      >
        <template #content>
          <div class="mb-4 flex items-center gap-2">
            <i class="pi pi-exclamation-circle text-amber-500" />
            <h2 class="m-0 text-base font-bold text-neutral-900">Perlu dievaluasi</h2>
          </div>

          <div
            v-if="!evaluation.length"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800"
          >
            Semua unsur layanan berada pada kategori baik. Pertahankan kualitas pelayanan saat ini.
          </div>

          <div v-else class="flex flex-col gap-3">
            <div
              v-for="item in evaluation"
              :key="item.key"
              class="flex flex-col gap-2 rounded-lg border p-4"
              :class="item.priority === 'high' ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-[14px] font-semibold text-neutral-900">{{ item.title }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    :class="item.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ item.priority === 'high' ? 'Prioritas tinggi' : 'Perlu ditingkatkan' }}
                  </span>
                </div>
                <span class="text-[12px] text-neutral-500">
                  IKM {{ formatNumber(item.ikm, 1) }} ({{ item.grade.label }}) ·
                  {{ formatNumber(item.dissatisfied, 0) }}% warga kurang puas
                </span>
              </div>
              <p class="m-0 text-[13px] text-neutral-700">{{ item.recommendation }}</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- ============ PER ELEMENT ============ -->
      <Card
        :pt="{
          root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
          body: { class: 'p-5' },
          content: { class: 'p-0' },
        }"
      >
        <template #content>
          <h2 class="m-0 mb-4 text-base font-bold text-neutral-900">Sebaran jawaban per unsur layanan</h2>
          <SurveyElementBars :elements="elements" show-distribution />
        </template>
      </Card>

      <!-- ============ TREND ============ -->
      <Card
        v-if="trend.length"
        :pt="{
          root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
          body: { class: 'p-5' },
          content: { class: 'p-0' },
        }"
      >
        <template #content>
          <h2 class="m-0 mb-4 text-base font-bold text-neutral-900">Tren bulanan</h2>
          <div class="flex items-end gap-3 overflow-x-auto pb-1">
            <div v-for="item in trend" :key="item.month" class="flex min-w-[3.5rem] flex-1 flex-col items-center gap-1">
              <span class="text-[11px] font-semibold" :class="getIkmGrade(averageToIkm(item.average)).text">
                {{ formatNumber(averageToIkm(item.average), 1) }}
              </span>
              <div class="flex h-28 w-full items-end rounded-md bg-neutral-100">
                <div
                  class="w-full rounded-md"
                  :class="getIkmGrade(averageToIkm(item.average)).bar"
                  :style="{ height: `${Math.max(6, (item.count / trendMaxCount) * 100)}%` }"
                  :title="`${item.count} responden`"
                />
              </div>
              <span class="text-[11px] text-neutral-500">{{ formatMonth(item.month) }}</span>
              <span class="text-[10px] text-neutral-400">{{ item.count }} resp.</span>
            </div>
          </div>
          <p class="m-0 mt-3 text-[11px] text-neutral-400">Tinggi batang = jumlah responden, angka di atas = nilai IKM bulan tersebut.</p>
        </template>
      </Card>

      <!-- ============ BREAKDOWNS ============ -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          v-for="group in breakdowns.filter(item => item.items.length)"
          :key="group.title"
          :pt="{
            root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
            body: { class: 'p-5' },
            content: { class: 'p-0' },
          }"
        >
          <template #content>
            <h2 class="m-0 mb-4 text-base font-bold text-neutral-900">{{ group.title }}</h2>
            <div class="flex flex-col gap-3">
              <div v-for="item in group.items" :key="item.label" class="flex flex-col gap-1">
                <div class="flex items-center justify-between gap-2 text-[12px]">
                  <span class="truncate text-neutral-700">{{ item.label }}</span>
                  <span class="shrink-0 text-neutral-500">
                    {{ item.count }} resp. ·
                    <span class="font-semibold" :class="getIkmGrade(averageToIkm(item.average)).text">
                      IKM {{ formatNumber(averageToIkm(item.average), 1) }}
                    </span>
                  </span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    class="h-full rounded-full bg-primary-500"
                    :style="{ width: `${(item.count / maxCount(group.items)) * 100}%` }"
                  />
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- ============ SUGGESTIONS ============ -->
      <Card
        :pt="{
          root: { class: 'rounded-lg border border-neutral-200 bg-white shadow-sm' },
          body: { class: 'p-5' },
          content: { class: 'p-0' },
        }"
      >
        <template #content>
          <h2 class="m-0 mb-4 text-base font-bold text-neutral-900">Saran & masukan terbaru</h2>

          <p v-if="!suggestions.length" class="m-0 text-[13px] text-neutral-400">Belum ada saran tertulis dari warga.</p>

          <ul v-else class="m-0 flex list-none flex-col gap-3 p-0">
            <li v-for="item in suggestions" :key="item.id" class="flex flex-col gap-1 rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
              <p class="m-0 text-[13px] text-neutral-800">{{ item.suggestion }}</p>
              <span class="text-[11px] text-neutral-400">
                {{ item.service_type }} · {{ formatDateTime(item.created_at) }}
              </span>
            </li>
          </ul>
        </template>
      </Card>

    </div>
  </div>
</template>