<script setup>
/* Merender blok isian surat (sections dari letterFields.js). Dipakai LetterWizard & BundleWizard. */
import InputText from "primevue/inputtext";
import Textarea from "primevue/textarea";
import DatePicker from "primevue/datepicker";
import Select from "primevue/select";
import Checkbox from "primevue/checkbox";
import Button from "primevue/button";
import { watch } from "vue";
import { visible, isFilled, emptyRow, toDate } from "./formLogic";
import { HUES, SECTION_HUES } from "./pastel";

const props = defineProps({
  sections: { type: Array, required: true },
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  autoFilled: { type: Object, default: () => ({}) }, // { [key]: true } → tampilkan penanda "terisi otomatis"
  idPrefix: { type: String, default: "f" },
});
const emit = defineEmits(["edit"]);

const hueFor = (i) => HUES[SECTION_HUES[i % SECTION_HUES.length]];
const edit = (key) => emit("edit", key);

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
                title="Diambil dari isian sebelumnya. Silakan periksa dan ubah bila perlu."
              >
                <i class="pi pi-bolt text-[9px]" /> terisi otomatis
              </span>
            </label>

            <Select v-if="field.type === 'select'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :options="field.options" :editable="field.editable" placeholder="Pilih" :invalid="!!errors[field.key]" class="w-full" @update:modelValue="edit(field.key)" />
            <DatePicker v-else-if="field.type === 'date'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" showIcon iconDisplay="input" dateFormat="dd/mm/yy" placeholder="dd/mm/yyyy" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />
            <Textarea v-else-if="field.type === 'textarea'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" rows="3" autoResize :placeholder="field.placeholder" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />
            <InputText v-else-if="field.type === 'time'" :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" type="time" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />

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
                    <Select v-if="c.type === 'select'" v-model="row[c.key]" :options="c.options" placeholder="Pilih" class="w-full" :invalid="rowInvalid(field, row, c)" />
                    <DatePicker v-else-if="c.type === 'date'" v-model="row[c.key]" showIcon iconDisplay="input" dateFormat="dd/mm/yy" :invalid="rowInvalid(field, row, c)" />
                    <InputText v-else v-model="row[c.key]" :invalid="rowInvalid(field, row, c)" />
                  </div>
                </div>
              </div>
              <div>
                <Button v-if="form[field.key].length < (field.max ?? 20)" label="Tambah baris" icon="pi pi-plus" size="small" severity="secondary" outlined @click="form[field.key].push(emptyRow(field.columns))" />
              </div>
            </div>

            <InputText v-else :id="`${idPrefix}-${field.key}`" v-model="form[field.key]" :maxlength="field.digits" :inputmode="field.digits ? 'numeric' : undefined" :placeholder="field.placeholder" :invalid="!!errors[field.key]" @update:modelValue="edit(field.key)" />

            <small v-if="errors[field.key]" class="text-red-500">{{ errors[field.key] }}</small>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>