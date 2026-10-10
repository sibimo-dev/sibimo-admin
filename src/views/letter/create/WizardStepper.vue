<script setup>
/* Indikator langkah.
   - ≤ 5 langkah  : lingkaran bernomor (seperti sebelumnya, tapi pastel)
   - > 5 langkah  : bar bersegmen + nama langkah aktif (muat untuk paket dengan banyak surat) */
import { computed } from "vue";
import { hue } from "./pastel";

const props = defineProps({
  steps: { type: Array, required: true }, // ["Isian", ...] atau [{ label, code }]
  current: { type: Number, default: 0 },
  maxReached: { type: Number, default: null }, // langkah tertinggi yang pernah dicapai (boleh diklik)
  hue: { type: String, default: "violet" },
});
const emit = defineEmits(["go"]);

const h = computed(() => hue(props.hue));
const items = computed(() => props.steps.map((s) => (typeof s === "string" ? { label: s } : s)));
const compact = computed(() => items.value.length > 5);
const reach = computed(() => props.maxReached ?? props.current);
const canGo = (i) => i <= reach.value && i !== props.current;
</script>

<template>
  <!-- Lingkaran -->
  <ol v-if="!compact" class="flex items-center">
    <li v-for="(s, i) in items" :key="i" class="flex items-center" :class="i < items.length - 1 ? 'flex-1' : ''">
      <button
        type="button"
        class="flex items-center focus:outline-none"
        :class="canGo(i) ? 'cursor-pointer' : 'cursor-default'"
        :disabled="!canGo(i)"
        @click="emit('go', i)"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold"
          :class="i < current ? h.circleDone : i === current ? h.circleNow : 'bg-white border-slate-200 text-slate-500'"
        >
          <i v-if="i < current" class="pi pi-check text-xs" />
          <span v-else>{{ i + 1 }}</span>
        </span>
        <span class="ml-2 text-sm hidden sm:inline" :class="i === current ? 'font-semibold text-slate-800' : 'text-slate-500'">{{ s.label }}</span>
      </button>
      <span v-if="i < items.length - 1" class="mx-3 h-1 flex-1 rounded-full" :class="i < current ? h.segOn : h.segOff" />
    </li>
  </ol>

  <!-- Bersegmen -->
  <div v-else>
    <div class="flex items-baseline justify-between gap-3">
      <p class="text-sm font-semibold text-slate-800 truncate">{{ items[current]?.label }}</p>
      <p class="text-xs shrink-0 text-slate-500">Langkah {{ current + 1 }} dari {{ items.length }}</p>
    </div>
    <ol class="mt-2 flex gap-1">
      <li v-for="(s, i) in items" :key="i" class="flex-1">
        <button
          type="button"
          class="block h-2.5 w-full rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
          :class="[i < current ? h.segOn : i === current ? h.segNow : h.segOff, canGo(i) ? 'cursor-pointer hover:opacity-80' : 'cursor-default']"
          :disabled="!canGo(i)"
          :title="s.code ? `${s.code} · ${s.label}` : s.label"
          :aria-label="`Langkah ${i + 1}: ${s.label}`"
          :aria-current="i === current ? 'step' : undefined"
          @click="emit('go', i)"
        />
      </li>
    </ol>
  </div>
</template>
