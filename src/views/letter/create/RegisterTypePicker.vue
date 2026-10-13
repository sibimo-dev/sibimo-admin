<script setup>
/* Pilih jenis pendaftaran warga baru (padanan pop-up "Daftar Sebagai Warga Baru" di public).
   Jenis yang dipilih menentukan surat/dokumen apa yang tampil di langkah "Pilih Surat" (lihat data/registrationDocs.js). */
import { RESIDENT_TYPES } from "@/data/registrationDocs";
import { hue } from "./pastel";

defineProps({ loading: { type: Boolean, default: false } });
const emit = defineEmits(["select"]);
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-slate-800">Jenis Pendaftaran</h2>
    <p class="text-sm mt-1 text-slate-500">Pilih status pemohon yang akan didaftarkan sebagai warga.</p>

    <div class="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
      <button
        v-for="t in RESIDENT_TYPES"
        :key="t.value"
        type="button"
        :disabled="loading"
        class="group relative overflow-hidden text-left rounded-3xl border-2 p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-60 disabled:pointer-events-none"
        :class="[hue(t.hue).card, hue(t.hue).cardHover]"
        @click="emit('select', t)"
      >
        <span class="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full transition-transform duration-300 group-hover:scale-125" :class="hue(t.hue).blob" />
        <span class="relative flex h-12 w-12 items-center justify-center rounded-2xl text-xl shadow-sm" :class="hue(t.hue).icon"><i :class="t.icon" /></span>
        <div class="relative">
          <h3 class="font-semibold text-slate-800">{{ t.label }}</h3>
          <p class="text-sm mt-1 text-slate-500">{{ t.description }}</p>
        </div>
      </button>
    </div>
  </div>
</template>
