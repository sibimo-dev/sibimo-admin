<script setup>
/* Kartu layanan pastel. Warna mengikuti KATEGORI surat (diberikan induk lewat prop `hue`) supaya seragam. */
import { computed } from "vue";
import { hue } from "./pastel";

const props = defineProps({
  service: { type: Object, required: true },
  hue: { type: String, default: "violet" },
});
defineEmits(["select"]);

const isBundle = computed(() => !!props.service.bundle);
const h = computed(() => hue(props.hue));
</script>

<template>
  <button
    type="button"
    class="group relative overflow-hidden text-left rounded-3xl border-2 p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
    :class="[h.card, h.cardHover]"
    @click="$emit('select', service)"
  >
    <span class="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full transition-transform duration-300 group-hover:scale-125" :class="h.blob" />
    <span class="pointer-events-none absolute -right-2 bottom-3 h-10 w-10 rounded-full bg-white/50" />

    <div class="relative flex items-start justify-between gap-2">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-3" :class="h.icon">
        <i :class="service.icon" />
      </span>
      <span v-if="isBundle" class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="h.pill">
        <i class="pi pi-objects-column text-[10px]" />
        {{ service.badge }}
      </span>
      <span v-else-if="service.internal" class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="h.pill">
        <i class="pi pi-building text-[10px]" />
        Surat Internal
      </span>
    </div>

    <div class="relative">
      <h3 class="font-semibold text-slate-800">{{ service.title }}</h3>
      <p class="text-sm mt-1 text-slate-500">{{ service.description }}</p>
    </div>

    <div class="relative mt-auto flex items-center justify-between pt-1">
      <span v-if="isBundle" class="text-xs font-medium" :class="h.text">{{ service.bundle.count }} pilihan surat dalam 1 pengajuan</span>
      <span v-else />
      <span class="flex items-center gap-1 text-xs font-medium opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" :class="h.text">
        Pilih surat <i class="pi pi-arrow-right text-[10px]" />
      </span>
    </div>
  </button>
</template>