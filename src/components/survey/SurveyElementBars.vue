<script setup>
import { computed } from 'vue'
import {
  SURVEY_ELEMENTS,
  SCORE_COLORS,
  SCORE_LABELS,
  averageToIkm,
  getIkmGrade,
  formatNumber,
} from '@/data/survey'

const props = defineProps({
  // [{ key, average, distribution: { 1: n, 2: n, 3: n, 4: n } }]
  elements: { type: Array, default: () => [] },
  // true  -> stacked bar showing how answers are spread across scores 1-4
  // false -> single bar showing the average score
  showDistribution: { type: Boolean, default: false },
})

const rows = computed(() =>
  SURVEY_ELEMENTS.map(definition => {
    const data = props.elements.find(element => element.key === definition.key)
    const average = Number(data?.average ?? 0)
    const distribution = data?.distribution ?? {}
    const total = [1, 2, 3, 4].reduce((sum, score) => sum + Number(distribution[score] ?? 0), 0)
    const ikm = averageToIkm(average)

    return {
      key: definition.key,
      title: definition.title,
      average,
      ikm,
      grade: getIkmGrade(ikm),
      hasData: total > 0,
      segments: [1, 2, 3, 4].map(score => ({
        score,
        count: Number(distribution[score] ?? 0),
        percent: total ? (Number(distribution[score] ?? 0) / total) * 100 : 0,
      })),
    }
  }),
)
</script>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="showDistribution" class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
      <span v-for="(label, index) in SCORE_LABELS" :key="label" class="inline-flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full" :class="SCORE_COLORS[index]" />
        {{ label }}
      </span>
    </div>

    <div v-for="row in rows" :key="row.key" class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-3">
        <span class="text-[13px] font-medium text-neutral-800">{{ row.title }}</span>
        <span class="flex items-center gap-2">
          <span class="text-[12px] tabular-nums text-neutral-500">
            {{ row.hasData ? `${formatNumber(row.average)} / 4` : '-' }}
          </span>
          <span
            v-if="row.hasData"
            class="rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :class="row.grade.badge"
          >
            {{ formatNumber(row.ikm, 1) }} · {{ row.grade.label }}
          </span>
        </span>
      </div>

      <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <template v-if="showDistribution">
          <div
            v-for="segment in row.segments"
            :key="segment.score"
            class="h-full transition-all duration-500"
            :class="SCORE_COLORS[segment.score - 1]"
            :style="{ width: `${segment.percent}%` }"
            :title="`${SCORE_LABELS[segment.score - 1]}: ${segment.count} (${formatNumber(segment.percent, 1)}%)`"
          />
        </template>
        <div
          v-else
          class="h-full rounded-full transition-all duration-500"
          :class="row.grade.bar"
          :style="{ width: `${(row.average / 4) * 100}%` }"
        />
      </div>
    </div>
  </div>
</template>