<script setup>
/* Merender blok isian surat (`sections` dari data/letter-forms). Mendukung tipe:
   text, textarea, select, date, time, checks (banyak pilihan), rows (baris berulang). */
import { watch } from 'vue'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { visible, isFilled, emptyRow, toDate } from '@/data/letter-forms/formLogic'

const props = defineProps({
  sections: { type: Array, required: true },
  form: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  idPrefix: { type: String, default: 'lf' },
})

const inputId = (field) => `${props.idPrefix}-${field.key}`
const spansTwo = (field) => field.span === 2 || field.type === 'rows' || field.type === 'checks'

/* Field tanggal dengan `dayKey`: isi field hari (Senin–Minggu) otomatis saat tanggal berubah. */
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const allFields = () => props.sections.flatMap((s) => s.fields)
watch(
  () => allFields().filter((x) => x.dayKey).map((x) => +toDate(props.form[x.key]) || 0),
  () => {
    const keys = new Set(allFields().map((x) => x.key))
    for (const x of allFields().filter((y) => y.dayKey && keys.has(y.dayKey))) {
      const d = toDate(props.form[x.key])
      if (d && !Number.isNaN(d.getTime())) props.form[x.dayKey] = HARI[d.getDay()]
    }
  },
  { immediate: true },
)

const rowInvalid = (field, row, c) =>
  !!props.errors[field.key] && !c.optional && !isFilled(row[c.key]) && Object.values(row).some(isFilled)
const minRows = (field) => field.min ?? (field.optional ? 0 : 1)
</script>

<template>
  <div class="space-y-5">
    <section v-for="(section, si) in sections" :key="si" class="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <h4 class="text-sm font-semibold text-slate-800">{{ section.title }}</h4>
      <p v-if="section.hint" class="mt-0.5 text-xs text-slate-500">{{ section.hint }}</p>

      <div class="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
        <template v-for="field in section.fields" :key="field.key">
          <div v-if="visible(field, form)" class="flex flex-col gap-1" :class="spansTwo(field) ? 'md:col-span-2' : ''">
            <label :for="inputId(field)" class="text-sm font-medium text-neutral-700">
              {{ field.label }}
              <span v-if="field.optional" class="font-normal text-slate-400"> (opsional)</span>
              <span v-else class="text-danger-500"> *</span>
            </label>

            <Select v-if="field.type === 'select'" :id="inputId(field)" v-model="form[field.key]" :options="field.options" :editable="field.editable" placeholder="Pilih" :invalid="!!errors[field.key]" class="w-full" />
            <DatePicker v-else-if="field.type === 'date'" :id="inputId(field)" v-model="form[field.key]" show-icon icon-display="input" date-format="dd/mm/yy" placeholder="dd/mm/yyyy" :invalid="!!errors[field.key]" />
            <Textarea v-else-if="field.type === 'textarea'" :id="inputId(field)" v-model="form[field.key]" rows="3" auto-resize :placeholder="field.placeholder" :invalid="!!errors[field.key]" />
            <InputText v-else-if="field.type === 'time'" :id="inputId(field)" v-model="form[field.key]" type="time" :invalid="!!errors[field.key]" />

            <!-- banyak pilihan. Opsi: "teks" | { value, label?, indent? } | { heading } -->
            <div
              v-else-if="field.type === 'checks'"
              class="grid grid-cols-1 gap-2 rounded-lg border bg-white p-3"
              :class="[field.cols === 1 ? '' : 'md:grid-cols-2', errors[field.key] ? 'border-red-400' : 'border-slate-200']"
            >
              <template v-for="o in field.options" :key="o.heading ?? o.value ?? o">
                <p v-if="o.heading" class="pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 first:pt-0" :class="field.cols === 1 ? '' : 'md:col-span-2'">{{ o.heading }}</p>
                <label v-else class="flex items-center gap-2 text-sm" :class="o.indent ? 'pl-7' : ''">
                  <Checkbox v-model="form[field.key]" :value="o.value ?? o" />
                  <span>{{ o.label ?? o.value ?? o }}</span>
                </label>
              </template>
            </div>

            <!-- baris berulang (anggota keluarga, saksi, dst.) -->
            <div v-else-if="field.type === 'rows'" class="flex flex-col gap-3">
              <div v-for="(row, i) in form[field.key]" :key="i" class="rounded-lg border border-slate-200 bg-white p-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-slate-500">#{{ i + 1 }}</span>
                  <Button v-if="form[field.key].length > minRows(field)" icon="pi pi-trash" text rounded size="small" severity="danger" aria-label="Hapus baris" @click="form[field.key].splice(i, 1)" />
                </div>
                <div class="mt-1 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div v-for="c in field.columns" :key="c.key" class="flex flex-col gap-1">
                    <label class="text-xs text-neutral-700">{{ c.label }}</label>
                    <Select v-if="c.type === 'select'" v-model="row[c.key]" :options="c.options" placeholder="Pilih" class="w-full" :invalid="rowInvalid(field, row, c)" />
                    <DatePicker v-else-if="c.type === 'date'" v-model="row[c.key]" show-icon icon-display="input" date-format="dd/mm/yy" :invalid="rowInvalid(field, row, c)" />
                    <InputText v-else v-model="row[c.key]" :invalid="rowInvalid(field, row, c)" />
                  </div>
                </div>
              </div>
              <div>
                <Button v-if="form[field.key].length < (field.max ?? 20)" label="Tambah baris" icon="pi pi-plus" size="small" severity="secondary" outlined @click="form[field.key].push(emptyRow(field.columns))" />
              </div>
            </div>

            <InputText v-else :id="inputId(field)" v-model="form[field.key]" :maxlength="field.digits" :inputmode="field.digits ? 'numeric' : undefined" :placeholder="field.placeholder" :invalid="!!errors[field.key]" />

            <small v-if="errors[field.key]" class="text-xs text-red-600">{{ errors[field.key] }}</small>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>
