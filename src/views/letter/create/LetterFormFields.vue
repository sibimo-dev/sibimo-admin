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
import { applyResidentToSections, visible, isFilled, emptyRow, toDate, syncFamilyRows, relocationMode, familyModeFor, householdOf, pickFamily } from "./formLogic";
import { DECEASED_NIK_KEY, KK_KEY, HEAD_KEY, hasDeceasedLookup, fillDeceasedData, clearDeceasedData, findHeadByKk, fillHeadOfFamily } from "./deceasedLookup";
import { HUES, SECTION_HUES } from "./pastel";
import { getRegions } from "@/services/region.service";
import { scopeWilayah } from "@/data/letterFields";

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
const hasObjectOptions = (options) => Array.isArray(options) && options.some((option) => option && typeof option === "object");

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

/* ---------- Surat kematian: NIK JENAZAH → data jenazah, KK, kepala keluarga, ibu & ayah ----------
   Begitu isian "NIK" pada blok Data Jenazah (key deceasedNik) berisi 16 digit, data warga dicari lewat NIK itu
   (bukan NIK pemohon). Bila ditemukan: data jenazah (nama, jenis kelamin, TTL, agama, pekerjaan, alamat), Nomor KK,
   Nama Kepala Keluarga, serta data ibu dan ayah (bila tercatat) terisi otomatis.
   Isian yang sudah diketik manual tidak ditimpa; isian otomatis dari NIK jenazah sebelumnya dikosongkan saat NIK berubah.
   Nomor KK yang diketik manual (tanpa NIK jenazah) juga mencari Nama Kepala Keluarga-nya. */
const deceased = reactive({ status: "idle", message: "" });
let deceasedTimer = null;
let deceasedSeq = 0;
const resultMessage = (r) => {
  const parents = r.mother && r.father ? "data ibu dan ayah" : r.mother ? "data ibu" : r.father ? "data ayah" : "";
  const missing = r.mother && r.father ? "" : r.mother ? " Data ayah belum tercatat, isi manual." : r.father ? " Data ibu belum tercatat, isi manual." : " Data ibu dan ayah belum tercatat, isi manual.";
  return `Data jenazah${parents ? `, ${parents}` : ""} terisi otomatis dari NIK ini. Periksa dan lengkapi bila perlu.${missing}`;
};
async function lookupDeceased() {
  const digits = String(props.form[DECEASED_NIK_KEY] ?? "").replace(/\D/g, "");
  const seq = ++deceasedSeq;
  if (digits.length !== 16) {
    clearDeceasedData(props.form, props.sections, props.autoFilled);
    Object.assign(deceased, { status: "idle", message: "" });
    return;
  }
  Object.assign(deceased, { status: "loading", message: "Mencari data jenazah..." });
  try {
    const resident = await findResidentByNik(digits);
    if (seq !== deceasedSeq) return; // NIK sudah berubah lagi selama pencarian
    if (!resident) {
      clearDeceasedData(props.form, props.sections, props.autoFilled);
      Object.assign(deceased, { status: "notfound", message: "NIK jenazah belum terdaftar di data warga. Isi data jenazah, ibu, dan ayah secara manual." });
      return;
    }
    const result = fillDeceasedData(props.form, props.sections, resident, props.autoFilled);
    Object.assign(deceased, { status: "found", message: resultMessage(result) });
  } catch (error) {
    if (seq !== deceasedSeq) return;
    Object.assign(deceased, { status: "error", message: error?.response?.data?.message || "Gagal mencari data warga. Isi data jenazah secara manual." });
  }
}
watch(
  () => props.form[DECEASED_NIK_KEY],
  () => {
    if (!hasDeceasedLookup(props.sections)) return;
    clearTimeout(deceasedTimer);
    deceasedTimer = setTimeout(lookupDeceased, 250);
  },
);

// Nomor KK diketik manual → Nama Kepala Keluarga menyesuaikan. KK yang baru saja diisi otomatis dari NIK jenazah dilewati.
let kkTimer = null;
let kkSeq = 0;
async function lookupHeadByKk() {
  const digits = String(props.form[KK_KEY] ?? "").replace(/\D/g, "");
  const seq = ++kkSeq;
  if (digits.length !== 16) return;
  try {
    const name = await findHeadByKk(digits);
    if (seq !== kkSeq) return;
    fillHeadOfFamily(props.form, props.sections, name, props.autoFilled);
  } catch {
    // pencarian gagal: nama kepala keluarga tetap diisi manual
  }
}
watch(
  () => props.form[KK_KEY],
  () => {
    if (!hasDeceasedLookup(props.sections) || !hasField(HEAD_KEY)) return;
    if (props.autoFilled[KK_KEY] && props.autoFilled.__deceased?.[KK_KEY]) return;
    clearTimeout(kkTimer);
    kkTimer = setTimeout(lookupHeadByKk, 250);
  },
);

const hamletOptions = ref([]);
const hamletSuggestions = ref([]);

const searchHamlets = (event) => {
  const query = String(event?.query ?? "").trim().toLocaleLowerCase("id-ID");
  hamletSuggestions.value = !query
    ? hamletOptions.value
    : hamletOptions.value.filter((name) => name.toLocaleLowerCase("id-ID").includes(query));
};

/* Isian bertipe `combo` (mis. Desa/Kecamatan/Kabupaten): pilih dari daftar ATAU ketik manual.
   field.options boleh array atau fungsi (form) => array, sehingga daftar bisa bergantung pada isian lain
   (daftar desa mengikuti kecamatan, daftar kecamatan mengikuti kabupaten, dst). */
const comboSuggestions = ref([]);
const searchCombo = (event, field) => {
  const list = typeof field.options === "function" ? field.options(props.form) : field.options ?? [];
  const query = String(event?.query ?? "").trim().toLocaleLowerCase("id-ID");
  comboSuggestions.value = !query ? list : list.filter((name) => name.toLocaleLowerCase("id-ID").includes(query));
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

/* Wilayah otomatis menurut "Cakupan Kepindahan" (field dengan `scopeAuto: { key, level }`).
   antar desa satu kecamatan → Ngemplak/Sleman/DIY; antar kecamatan satu kabupaten → Sleman/DIY; antar kabupaten/provinsi → DIY.
   Hanya menimpa isian yang masih kosong atau yang masih berisi nilai otomatis dari cakupan sebelumnya,
   jadi ketikan/pilihan manual petugas tidak hilang. */
const scopeSeen = {};
const scopeFields = () => allFields().filter((x) => x.scopeAuto);
watch(
  () => [...new Set(scopeFields().map((x) => x.scopeAuto.key))].map((k) => props.form[k] ?? "").join("|"),
  () => {
    for (const k of new Set(scopeFields().map((x) => x.scopeAuto.key))) {
      const now = scopeWilayah(props.form[k]);
      const before = scopeSeen[k] ?? {};
      for (const x of scopeFields().filter((y) => y.scopeAuto.key === k)) {
        const level = x.scopeAuto.level;
        const value = props.form[x.key];
        if (!isFilled(value) || value === before[level]) props.form[x.key] = now[level] ?? "";
      }
      scopeSeen[k] = now;
    }
  },
  { immediate: true },
);

/* Pilihan select: boleh teks biasa atau { value, label } (label bernomor, value = nilai yang disimpan). */
const selectBind = (options) => (Array.isArray(options) && options.some((o) => o && typeof o === "object") ? { optionLabel: "label", optionValue: "value" } : {});

/* Umur otomatis: field dengan `ageOf` (kunci tanggal lahir) mengikuti tanggal lahir selama tanggal lahirnya ada di form ini.
   Bila isian umur opsional dan tanggal lahir kosong (tanggal tidak diketahui), umur boleh diisi manual. */
const ageYears = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const today = new Date();
  if (date > today) return "";
  let years = today.getFullYear() - date.getFullYear();
  if (today.getMonth() < date.getMonth() || (today.getMonth() === date.getMonth() && today.getDate() < date.getDate())) years -= 1;
  return String(Math.max(years, 0));
};
const hasField = (key) => allFields().some((x) => x.key === key);
const ageFields = () => allFields().filter((x) => x.ageOf && hasField(x.ageOf));
const ageLocked = (field) => !!field.ageOf && hasField(field.ageOf) && (!field.optional || isFilled(props.form[field.ageOf]));
watch(
  () => ageFields().map((x) => +toDate(props.form[x.ageOf]) || 0),
  () => {
    for (const x of ageFields()) {
      const date = toDate(props.form[x.ageOf]);
      if (date && !Number.isNaN(date.getTime())) props.form[x.key] = ageYears(date);
      else if (!x.optional) props.form[x.key] = "";
    }
  },
  { immediate: true },
);

/* Isian pekerjaan (tipe `occupation`): cari di daftar bernomor (sama dengan Data Warga) atau ketik bebas.
   Dropdown menampilkan "5. Pegawai Negeri Sipil (PNS)", tetapi yang disimpan hanya namanya ("Pegawai Negeri Sipil (PNS)")
   supaya surat tercetak bersih tanpa nomor. Dipakai di field biasa dan di kolom baris berulang. */
const bareJob = (v) => String(v ?? "").replace(/^\s*\d+\s*[.)\-:]\s*/, "").trim();
const jobSuggestions = ref([]);
const searchJobs = (event, options) => {
  const query = String(event?.query ?? "").trim().toLowerCase();
  jobSuggestions.value = (options ?? []).filter((option) => !query || String(option).toLowerCase().includes(query));
};
const setJob = (target, key, value) => { target[key] = value ?? ""; };

/* Kolom baris yang tidak berlaku (mis. Akta Perkawinan saat belum kawin) dinonaktifkan dan dikosongkan. */
const colDisabled = (c, row) => !!c.disabledWhen && !!c.disabledWhen(row);
function syncRow(field, row) {
  for (const c of field.columns) if (colDisabled(c, row) && isFilled(row[c.key])) row[c.key] = c.default ?? "";
}

const rowInvalid = (field, row, c) =>
  !!props.errors[field.key] && !c.optional && !isFilled(row[c.key]) && Object.values(row).some(isFilled);
/* Kolom tanggal dengan `lifetime: true` (Masa Berlaku KTP): centang "Seumur hidup" mengisi nilai teks LIFETIME sebagai pengganti tanggal. */
const LIFETIME = "SEUMUR HIDUP";
const isLifetime = (v) => String(v ?? "").trim().toUpperCase() === LIFETIME;
const setLifetime = (row, c, on) => { row[c.key] = on ? LIFETIME : ""; };
const minRows = (field) => field.min ?? (field.optional ? 0 : 1);

/* ---------- Keluarga yang pindah: mengikuti Jenis Kepindahan (field rows dengan `autoByType`) ----------
   mode: head | all | others → baris otomatis & terkunci (tanpa tambah/hapus baris); partial → kepala keluarga otomatis,
   anggota lain ditambah manual. Tanpa data KK (NIK pemohon belum dicari) → tampil sebagai baris manual biasa.
   Bila KK tidak punya anggota yang cocok dengan pilihan (mis. "Anggota Keluarga" tetapi KK hanya berisi kepala keluarga),
   familyModeFor() mengembalikan null → baris tidak dikunci dan bisa diisi/ditambah manual. */
const rowMode = (field) => {
  if (!field.autoByType) return null;
  const household = householdOf(props.autoFilled);
  return household.length ? familyModeFor(props.form[field.autoByType], household) : null;
};
// KK ditemukan & Jenis Kepindahan dipilih, tetapi tidak ada anggota KK yang cocok → isian manual.
const noAutoMatch = (field) =>
  !!field.autoByType && householdOf(props.autoFilled).length > 0 && !!relocationMode(props.form[field.autoByType]) && !rowMode(field);
const isHeadRow = (row) => {
  const nik = String(row?.nik ?? "");
  return !!nik && pickFamily("head", householdOf(props.autoFilled)).some((p) => String(p.nik ?? "") === nik);
};
const isLocked = (field, row) => {
  const mode = rowMode(field);
  return !!mode && (mode !== "partial" || isHeadRow(row));
};
const canAddRow = (field) => {
  const mode = rowMode(field);
  return !mode || mode === "partial";
};
const MODE_HINT = {
  head: "Hanya kepala keluarga yang pindah (terisi otomatis dari KK).",
  all: "Seluruh anggota keluarga ikut pindah (terisi otomatis dari KK).",
  partial: "Kepala keluarga terisi otomatis. Tambahkan anggota keluarga yang ikut pindah dengan tombol di bawah.",
  others: "Seluruh anggota keluarga kecuali kepala keluarga (terisi otomatis dari KK).",
};
const NO_MATCH_HINT = "Tidak ada anggota KK yang sesuai dengan Jenis Kepindahan ini, jadi isi anggota keluarga secara manual (atau ubah Jenis Kepindahan).";
const modeHint = (field) => {
  if (noAutoMatch(field)) return NO_MATCH_HINT;
  return field.fromHousehold ? (props.autoFilled[field.key] ? "Terisi otomatis dari anggota KK yang terdaftar. Periksa, lengkapi, atau ubah bila perlu." : "") : MODE_HINT[rowMode(field)] ?? "";
};
const overflowCount = (field) => {
  if (field.fromHousehold) return Math.max(0, householdOf(props.autoFilled).length - (field.max ?? 20));
  const mode = rowMode(field);
  return mode ? Math.max(0, pickFamily(mode, householdOf(props.autoFilled)).length - (field.max ?? 20)) : 0;
};
const cellText = (c, value) => {
  const opt = Array.isArray(c.options) ? c.options.find((o) => String(o?.value ?? o).toLowerCase() === String(value ?? "").trim().toLowerCase()) : null;
  return String(opt?.label ?? opt ?? value ?? "").trim() || "-";
};
// Di baris manual (mode partial / tanpa kecocokan): NIK anggota KK yang diketik lengkap → nama & SHDK terisi otomatis.
function onRowInput(field, row, c) {
  if (!field.autoByType || c.key !== "nik") return;
  const nik = String(row.nik ?? "").trim();
  const person = nik.length === 16 ? householdOf(props.autoFilled).find((p) => String(p.nik ?? "") === nik) : null;
  if (!person) return;
  if (!isFilled(row.name)) row.name = person.fullName ?? "";
  if (!isFilled(row.shdk)) row.shdk = person.familyRelationship ?? "";
}
const resyncFamily = () => syncFamilyRows(props.form, props.sections, props.autoFilled);
watch(
  () => props.sections.flatMap((s) => s.fields).filter((x) => x.autoByType).map((x) => props.form[x.autoByType]).join("|"),
  resyncFamily,
);
onMounted(resyncFamily);
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
            :data-field-key="field.key"
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

            <Select v-if="field.type === 'select'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :options="field.options" :optionLabel="hasObjectOptions(field.options) ? 'label' : undefined" :optionValue="hasObjectOptions(field.options) ? 'value' : undefined" :editable="field.editable" :disabled="field.readonly || field.disabled" placeholder="Pilih" :invalid="fieldInvalid(field, form[field.key])" class="w-full" @update:modelValue="edit(field.key)" />
            <DatePicker v-else-if="field.type === 'date'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" showIcon iconDisplay="input" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :disabled="field.readonly || field.disabled" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />
            <AutoComplete v-else-if="field.type === 'occupation'" :inputId="`${idPrefix}-${field.key}`" :modelValue="form[field.key]" :suggestions="jobSuggestions" dropdown :forceSelection="false" :disabled="field.readonly || field.disabled" :invalid="!!errors[field.key]" placeholder="Cari atau ketik pekerjaan" class="w-full" inputClass="w-full" @complete="searchJobs($event, field.options)" @item-select="setJob(form, field.key, bareJob($event.value)); edit(field.key)" @update:modelValue="setJob(form, field.key, $event); edit(field.key)" />
            <AutoComplete v-else-if="field.type === 'hamlet'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :suggestions="hamletSuggestions" dropdown placeholder="Pilih atau ketik nama dusun" :disabled="field.readonly || field.disabled" :invalid="!!errors[field.key]" class="w-full" inputClass="w-full" @complete="searchHamlets" @update:modelValue="edit(field.key)" />
            <AutoComplete v-else-if="field.type === 'combo'" :inputId="`${idPrefix}-${field.key}`" :modelValue="form[field.key]" :suggestions="comboSuggestions" dropdown :forceSelection="false" placeholder="Pilih atau ketik manual" :disabled="field.readonly || field.disabled" :invalid="!!errors[field.key]" class="w-full" inputClass="w-full" @complete="searchCombo($event, field)" @update:modelValue="form[field.key] = $event ?? ''; edit(field.key)" />
            <Textarea v-else-if="field.type === 'textarea'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" rows="3" autoResize :placeholder="field.placeholder" :readonly="field.readonly" :disabled="field.disabled" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />
            <InputText v-else-if="field.type === 'time'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" type="time" :readonly="field.readonly" :disabled="field.disabled" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />

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
              <p v-if="modeHint(field)" class="text-xs" :class="noAutoMatch(field) ? 'text-amber-700' : 'text-slate-600'">{{ modeHint(field) }}</p>
              <p v-if="overflowCount(field)" class="text-xs text-amber-700">Formulir hanya memuat {{ field.max }} baris; {{ overflowCount(field) }} anggota keluarga lainnya tidak tercantum.</p>
              <div v-for="(row, i) in form[field.key]" :key="i" class="rounded-xl border border-white bg-white/80 p-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-500">#{{ i + 1 }}</span>
                  <span v-if="isLocked(field, row)" class="text-[11px] text-emerald-700">otomatis</span>
                  <Button v-else-if="form[field.key].length > minRows(field)" icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Hapus baris" @click="form[field.key].splice(i, 1)" />
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div v-for="c in field.columns" :key="c.key" class="flex flex-col gap-1">
                    <label class="text-xs text-slate-800">{{ c.label }}</label>
                    <Select v-if="c.type === 'select'" v-model="row[c.key]" :options="c.options" :optionLabel="hasObjectOptions(c.options) ? 'label' : undefined" :optionValue="hasObjectOptions(c.options) ? 'value' : undefined" placeholder="Pilih" class="w-full" :invalid="rowInvalid(field, row, c) || nikInvalid(c, row[c.key])" />
                    <!-- kolom tanggal; bila c.lifetime: ada centang "Seumur hidup" (nilai tersimpan = teks SEUMUR HIDUP) -->
                    <template v-else-if="c.type === 'date'">
                      <InputText
                        v-if="c.lifetime && isLifetime(row[c.key])"
                        model-value="SEUMUR HIDUP"
                        readonly
                        class="bg-slate-100"
                      />
                      <DatePicker
                        v-else
                        v-model="row[c.key]"
                        showIcon
                        iconDisplay="input"
                        dateFormat="dd/mm/yy"
                        :invalid="rowInvalid(field, row, c)"
                      />
                      <label v-if="c.lifetime" class="flex items-center gap-2 text-xs text-slate-700">
                        <Checkbox
                          binary
                          :modelValue="isLifetime(row[c.key])"
                          @update:modelValue="setLifetime(row, c, $event)"
                        />
                        Seumur hidup
                      </label>
                    </template>
                    <InputText v-else v-model="row[c.key]" :maxlength="isNikField(c) ? 16 : undefined" :inputmode="isNikField(c) ? 'numeric' : undefined" :invalid="rowInvalid(field, row, c) || nikInvalid(c, row[c.key])" />
                    <small v-if="nikInvalid(c, row[c.key])" class="text-red-500">{{ c.label }} harus tepat 16 digit angka.</small>
                  </div>
                </div>
              </div>
              <div>
                <Button v-if="canAddRow(field) && form[field.key].length < (field.max ?? 20)" label="Tambah baris" icon="pi pi-plus" size="small" severity="secondary" outlined @click="form[field.key].push(emptyRow(field.columns))" />
              </div>
            </div>

            <InputText v-else :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :maxlength="isNikField(field) ? 16 : field.digits" :inputmode="isNikField(field) || field.digits ? 'numeric' : undefined" :placeholder="field.placeholder" :readonly="field.readonly || ageLocked(field)" :class="ageLocked(field) ? 'bg-slate-100' : ''" :disabled="field.disabled" :invalid="fieldInvalid(field, form[field.key])" @update:modelValue="edit(field.key)" />

            <small v-if="nikInvalid(field, form[field.key])" class="text-red-500">{{ field.label }} harus tepat 16 digit angka.</small>
            <small v-if="errors[field.key]" class="text-red-500">{{ errors[field.key] }}</small>
            <small
              v-if="field.key === DECEASED_NIK_KEY && deceased.message && /^\d{16}$/.test(String(form[field.key] ?? '').trim())"
              :class="deceased.status === 'found' ? 'text-emerald-700' : deceased.status === 'error' ? 'text-red-600' : deceased.status === 'loading' ? 'text-slate-500' : 'text-amber-700'"
              aria-live="polite"
            >{{ deceased.message }}</small>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>