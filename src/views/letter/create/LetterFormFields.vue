<script setup>
/* Merender blok isian surat (sections dari letterFields.js). Dipakai LetterWizard & BundleWizard. */
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import DatePicker from "primevue/datepicker";
import Select from "primevue/select";
import AutoComplete from "primevue/autocomplete";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import { onMounted, reactive, ref, watch } from "vue";
import { findResidentByNik } from "@/services/resident-lookup.service";
import { applyResidentToSections, visible, isFilled, emptyRow, toDate } from "./formLogic";
import { HUES, SECTION_HUES } from "./pastel";
import { getRegions } from "@/services/region.service";

const props = defineProps({
  sections: { type: Array, required: true },
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  autoFilled: { type: Object, default: () => ({}) }, // { [key]: true } → tampilkan penanda "terisi otomatis"
  idPrefix: { type: String, default: "f" },
});
const emit = defineEmits(["edit", "resident-found", "resident-cleared"]);

const hueFor = (i) => HUES[SECTION_HUES[i % SECTION_HUES.length]];
const edit = (key) => emit("edit", key);

const catinLookups = reactive({});
const catinState = (lookupKey) => {
  if (!catinLookups[lookupKey]) {
    catinLookups[lookupKey] = reactive({ nik: "", status: "idle", name: "", filled: 0, message: "" });
  }
  return catinLookups[lookupKey];
};
const catinSearchTimers = new Map();

const isNikField = (field) => field.digits === 16 || /(^|[^a-z])nik([^a-z]|$)/i.test(`${field.key} ${field.label}`);
const nikInvalid = (field, value) => isNikField(field) && isFilled(value) && !/^\d{16}$/.test(String(value).trim());
const fieldInvalid = (field, value) => !!props.errors[field.key] || nikInvalid(field, value);

async function searchCatin(section) {
  const state = catinState(section.lookupKey);
  const pending = catinSearchTimers.get(section.lookupKey);
  if (pending) {
    clearTimeout(pending);
    catinSearchTimers.delete(section.lookupKey);
  }
  const digits = String(state.nik ?? "").replace(/\D/g, "");
  state.nik = digits;
  if (digits.length !== 16) {
    Object.assign(state, { status: "invalid", message: "NIK harus tepat 16 digit angka." });
    emit("resident-cleared", section.lookupKey);
    return;
  }

  state.status = "loading";
  state.message = "";
  try {
    const resident = await findResidentByNik(digits);
    if (!resident) {
      Object.assign(state, { status: "notfound", name: "", filled: 0, message: "NIK belum terdaftar di data warga." });
      emit("resident-cleared", section.lookupKey);
      return;
    }
    const parentSections = props.sections.filter((candidate) => candidate.parentOf === section.lookupKey);
    const filled = applyResidentToSections(props.form, section, parentSections, resident, props.autoFilled);
    Object.assign(state, { status: "found", name: resident.fullName, filled: filled.length, message: "" });
    emit("resident-found", { lookupKey: section.lookupKey, resident });
  } catch (error) {
    Object.assign(state, { status: "error", message: error?.response?.data?.message || "Gagal mencari data warga. Coba lagi." });
  }
}

function onCatinNikInput(section, event) {
  const state = catinState(section.lookupKey);
  const digits = String(event?.target?.value ?? state.nik).replace(/\D/g, "").slice(0, 16);
  state.nik = digits;

  const pending = catinSearchTimers.get(section.lookupKey);
  if (pending) clearTimeout(pending);
  catinSearchTimers.delete(section.lookupKey);

  if (!digits) {
    Object.assign(state, { status: "idle", name: "", filled: 0, message: "" });
    emit("resident-cleared", section.lookupKey);
    return;
  }
  if (digits.length !== 16) {
    Object.assign(state, { status: "invalid", name: "", filled: 0, message: "NIK harus tepat 16 digit angka." });
    return;
  }

  // Beri jeda singkat agar paste/ketikan selesai, lalu cari otomatis.
  Object.assign(state, { status: "idle", message: "" });
  const timer = setTimeout(() => {
    catinSearchTimers.delete(section.lookupKey);
    searchCatin(section);
  }, 200);
  catinSearchTimers.set(section.lookupKey, timer);
}

const hamletOptions = ref([]);
const hamletSuggestions = ref([]);

const searchHamlets = (event) => {
  const query = String(event?.query ?? "").trim().toLocaleLowerCase("id-ID");
  hamletSuggestions.value = !query
    ? hamletOptions.value
    : hamletOptions.value.filter((name) => name.toLocaleLowerCase("id-ID").includes(query));
};

onMounted(async () => {
  try {
    const rows = await getRegions();
    hamletOptions.value = [...new Set((rows ?? []).map((row) => String(row?.name ?? "").trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "id"));
  } catch {
    // Tetap izinkan input manual jika endpoint wilayah tidak tersedia.
    hamletOptions.value = [];
  }
});

/* Field tanggal dengan `dayKey`: isi field hari (Senin–Minggu) otomatis tiap tanggal berubah. */
const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const allFields = () => props.sections.flatMap((s) => s.fields);
watch(
  () => allFields().filter((x) => x.dayKey).map((x) => +toDate(props.form[x.key]) || 0),
  () => {
    const keys = new Set(allFields().map((x) => x.key));
    for (const x of allFields().filter((y) => y.dayKey && keys.has(y.dayKey))) {
      const d = toDate(props.form[x.key]);
      if (d && !Number.isNaN(d.getTime())) props.form[x.dayKey] = HARI[d.getDay()];
    }
  },
  { immediate: true },
);
const rowInvalid = (field, row, c) =>
  !!props.errors[field.key] && !c.optional && !isFilled(row[c.key]) && Object.values(row).some(isFilled);
const minRows = (field) => field.min ?? (field.optional ? 0 : 1);
</script>

<template>
  <div class="flex flex-col gap-5">
    <section
      v-for="(section, si) in sections"
      :key="si"
      class="rounded-2xl border p-4 sm:p-5"
      :class="hueFor(si).softer"
    >
      <div class="flex items-center gap-2">
        <span class="h-2.5 w-2.5 rounded-full" :class="hueFor(si).dot" />
        <p class="text-sm font-semibold text-slate-800">{{ section.title }}</p>
      </div>
      <p v-if="section.hint" class="text-xs mt-1 text-slate-500">{{ section.hint }}</p>

      <div v-if="section.lookupKey" class="mt-4 rounded-xl border border-primary-100 bg-primary-50/60 p-3">
        <div class="flex items-center gap-2">
          <i class="pi pi-search text-primary-600" />
          <p class="text-xs font-semibold text-slate-800">Cari Data Catin {{ section.lookupKey === 'groom' ? 'Pria' : 'Wanita' }}</p>
        </div>
        <p class="mt-1 text-xs text-slate-500">Masukkan NIK catin pasangan. Jika terdaftar, data di blok ini akan terisi otomatis.</p>
        <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
          <div class="flex flex-col gap-1 sm:w-80">
            <label :for="`${idPrefix}-${section.lookupKey}-lookup`" class="text-xs text-slate-800">NIK Catin</label>
            <InputText
              :id="`${idPrefix}-${section.lookupKey}-lookup`"
              v-model="catinState(section.lookupKey).nik"
              maxlength="16"
              inputmode="numeric"
              placeholder="16 digit NIK"
              :invalid="catinState(section.lookupKey).status === 'invalid' || (catinState(section.lookupKey).nik !== '' && !/^\d{16}$/.test(catinState(section.lookupKey).nik))"
              @input="onCatinNikInput(section, $event)"
              @keyup.enter="searchCatin(section)"
            />
          </div>
          <Button label="Cari" icon="pi pi-search" class="sm:mt-[1.375rem]" :loading="catinState(section.lookupKey).status === 'loading'" @click="searchCatin(section)" />
        </div>
        <div v-if="catinState(section.lookupKey).status === 'found'" class="mt-3 flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800" aria-live="polite">
          <i class="pi pi-check-circle mt-0.5" />
          <span><b>{{ catinState(section.lookupKey).name }}</b> ditemukan · {{ catinState(section.lookupKey).filled }} isian otomatis.</span>
        </div>
        <p v-else-if="['invalid', 'error'].includes(catinState(section.lookupKey).status)" class="mt-2 text-xs text-red-600">{{ catinState(section.lookupKey).message }}</p>
        <p v-else-if="catinState(section.lookupKey).status === 'notfound'" class="mt-2 text-xs text-amber-700">{{ catinState(section.lookupKey).message }} Isi data catin secara manual.</p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <template v-for="field in section.fields" :key="field.key">
          <div
            v-if="visible(field, form)"
            class="flex flex-col gap-1"
            :class="field.span === 2 || field.type === 'rows' || field.type === 'checks' ? 'sm:col-span-2' : ''"
          >
            <label :for="`${idPrefix}-${field.key}`" class="text-sm text-slate-800 flex flex-wrap items-center gap-x-2">
              <span>{{ field.label }}<span v-if="field.optional" class="text-slate-500"> (opsional)</span></span>
              <span
                v-if="autoFilled[field.key]"
                class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                title="Diambil dari data warga / isian sebelumnya. Silakan periksa dan ubah bila perlu."
              >
                <i class="pi pi-bolt text-[9px]" /> terisi otomatis
              </span>
            </label>

            <Select v-if="field.type === 'select'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :options="field.options" :editable="field.editable" :disabled="field.readonly || field.disabled" placeholder="Pilih" :invalid="fieldInvalid(field, form[field.key])" class="w-full" @update:modelValue="edit(field.key)" />
            <DatePicker v-else-if="field.type === 'date'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" showIcon iconDisplay="input" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :disabled="field.readonly || field.disabled" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />
            <AutoComplete v-else-if="field.type === 'hamlet'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :suggestions="hamletSuggestions" dropdown placeholder="Pilih atau ketik nama dusun" :disabled="field.readonly || field.disabled" :invalid="!!errors[field.key]" class="w-full" inputClass="w-full" @complete="searchHamlets" @update:modelValue="edit(field.key)" />
            <Textarea v-else-if="field.type === 'textarea'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" rows="3" autoResize :placeholder="field.placeholder" :readonly="field.readonly" :disabled="field.disabled" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />
            <InputText v-else-if="field.type === 'time'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" type="time" :readonly="field.readonly" :disabled="field.disabled" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />

            <!-- pilihan banyak -->
            <!-- pilihan banyak. Opsi: "teks" | { value, label?, indent? } | { heading: "A. BARU" } (judul, tidak bisa dicentang).
                 field.cols === 1 → satu kolom (untuk daftar bertingkat). -->
            <div v-else-if="field.type === 'checks'" class="grid grid-cols-1 gap-2 rounded-xl border bg-white p-3" :class="[field.cols === 1 ? '' : 'sm:grid-cols-2', errors[field.key] ? 'border-red-400' : 'border-slate-200']">
              <template v-for="o in field.options" :key="o.heading ?? o.value ?? o">
                <p v-if="o.heading" class="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pt-0" :class="field.cols === 1 ? '' : 'sm:col-span-2'">{{ o.heading }}</p>
                <label v-else class="flex items-center gap-2 text-sm" :class="o.indent ? 'pl-7' : ''">
                  <Checkbox v-model="form[field.key]" :value="o.value ?? o" />
                  <span>{{ o.label ?? o.value ?? o }}</span>
                </label>
              </template>
            </div>

            <!-- baris berulang -->
            <div v-else-if="field.type === 'rows'" class="flex flex-col gap-3">
              <div v-for="(row, i) in form[field.key]" :key="i" class="rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-500">#{{ i + 1 }}</span>
                  <Button v-if="form[field.key].length > minRows(field)" icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Hapus baris" @click="form[field.key].splice(i, 1)" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div v-for="c in field.columns" :key="c.key" class="flex flex-col gap-1">
                    <label class="text-xs text-slate-800">{{ c.label }}</label>
                    <Select v-if="c.type === 'select'" v-model="row[c.key]" :options="c.options" placeholder="Pilih" class="w-full" :invalid="rowInvalid(field, row, c) || nikInvalid(c, row[c.key])" />
                    <DatePicker v-else-if="c.type === 'date'" v-model="row[c.key]" showIcon iconDisplay="input" dateFormat="dd/mm/yy" :invalid="rowInvalid(field, row, c)" />
                    <InputText v-else v-model="row[c.key]" :maxlength="isNikField(c) ? 16 : undefined" :inputmode="isNikField(c) ? 'numeric' : undefined" :invalid="rowInvalid(field, row, c) || nikInvalid(c, row[c.key])" />
                    <small v-if="nikInvalid(c, row[c.key])" class="text-red-500">{{ c.label }} harus tepat 16 digit angka.</small>
                  </div>
                </div>
              </div>
              <div>
                <Button v-if="form[field.key].length < (field.max ?? 20)" label="Tambah baris" icon="pi pi-plus" size="small" severity="secondary" outlined @click="form[field.key].push(emptyRow(field.columns))" />
              </div>
            </div>

            <InputText v-else :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :maxlength="isNikField(field) ? 16 : field.digits" :inputmode="isNikField(field) || field.digits ? 'numeric' : undefined" :placeholder="field.placeholder" :readonly="field.readonly" :disabled="field.disabled" :invalid="fieldInvalid(field, form[field.key])" @update:modelValue="edit(field.key)" />

            <small v-if="nikInvalid(field, form[field.key])" class="text-red-500">{{ field.label }} harus tepat 16 digit angka.</small>
            <small v-if="errors[field.key]" class="text-red-500">{{ errors[field.key] }}</small>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
