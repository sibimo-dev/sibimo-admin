<script setup>
/* Kotak "Cari Data Pemohon": input NIK paling atas di form Tambah Surat. Begitu NIK 16 digit diisi
   (atau tombol Cari / Enter), data warga dari backend mengisi formulir otomatis. Tetap bisa diubah manual.
   Komponen ini hanya tampilan: logika pencarian ada di useApplicantLookup.js. */
import { computed, watch } from "vue";
import Button from "primevue/button";
import InputText from "primevue/inputtext";

const props = defineProps({
  state: { type: Object, required: true }, // dari useApplicantLookup()
});
const emit = defineEmits(["search"]);
const nikInvalid = computed(() => {
  const value = String(props.state.nik ?? "");
  return value !== "" && !/^\d{16}$/.test(value);
});

// cari otomatis begitu NIK genap 16 digit
watch(
  () => props.state.nik,
  (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    if (digits !== value) props.state.nik = digits;
    else if (digits.length === 16) emit("search");
    else if (props.state.status !== "idle" && props.state.status !== "loading") props.state.status = "idle";
  },
);
</script>

<template>
  <section class="rounded-2xl border p-4 sm:p-5 bg-gradient-to-br from-primary-50/80 to-white border-primary-100">
    <div class="flex items-center gap-2">
      <span class="h-2.5 w-2.5 rounded-full bg-primary-500" />
      <p class="text-sm font-semibold text-slate-800">Cari Data Pemohon</p>
    </div>
    <p class="text-xs mt-1 text-slate-500">Mulai dari NIK pemohon. Bila sudah terdaftar di data warga, isian di bawah terisi otomatis.</p>

    <div class="mt-3 flex flex-col sm:flex-row gap-2 sm:items-start">
      <div class="flex flex-col gap-1 sm:w-80">
        <label for="applicant-nik" class="text-sm text-slate-800">NIK Pemohon</label>
        <InputText
          id="applicant-nik"
          v-model="state.nik"
          maxlength="16"
          inputmode="numeric"
          autocomplete="off"
          placeholder="16 digit NIK"
          :invalid="nikInvalid || state.status === 'invalid'"
          @keyup.enter="emit('search')"
        />
        <small class="text-xs" :class="nikInvalid ? 'text-red-600' : 'text-slate-500'">
          {{ nikInvalid ? 'NIK harus tepat 16 digit angka.' : 'Masukkan 16 digit angka.' }}
        </small>
      </div>
      <Button label="Cari" icon="pi pi-search" class="sm:mt-[1.625rem]" :loading="state.status === 'loading'" @click="emit('search')" />
    </div>

    <p v-if="state.status === 'found'" class="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
      <i class="pi pi-check-circle mt-0.5" />
      <span><b>{{ state.name }}</b> ditemukan. {{ state.filled }} isian terisi otomatis, periksa dan ubah bila perlu.</span>
    </p>
    <p v-else-if="state.status === 'notfound'" class="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
      <i class="pi pi-info-circle mt-0.5" />
      <span>NIK belum terdaftar di data warga. Isi data pemohon secara manual (NIK sudah terisi).</span>
    </p>
    <p v-else-if="state.status === 'invalid' || state.status === 'error'" class="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
      <i class="pi pi-exclamation-circle mt-0.5" />
      <span>{{ state.message }}</span>
    </p>
  </section>
</template>
