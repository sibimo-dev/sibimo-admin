<script setup>
/* Daftar dokumen pendukung + tombol unggah (maks 5 MB per file; JPG/PNG/PDF).
   `files` = objek reaktif { [doc.id]: File } milik induk. Komponen ini hanya memberi tahu induk lewat event. */
import { reactive, ref } from "vue";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import FileThumb from "./FileThumb.vue";
import FilePreviewDialog from "./FilePreviewDialog.vue";
import { MAX_FILE_MB, checkFile, fileSizeLabel } from "./formLogic";

const props = defineProps({
  docs: { type: Array, required: true }, // [{ id, label, optional }]
  files: { type: Object, required: true },
  errors: { type: Object, default: () => ({}) },
  /* Opsional: (doc) => ({ title, file }) | null — tawarkan memakai file yang sama dari surat lain. */
  suggest: { type: Function, default: null },
});
const emit = defineEmits(["select", "remove", "reuse"]);

const localErrors = reactive({});
const preview = reactive({ open: false, file: null, title: "" });
const openPreview = (doc) => Object.assign(preview, { open: true, file: props.files[doc.id], title: doc.label });
const errorOf = (id) => localErrors[id] || props.errors[id];

function onSelect(id, event) {
  const file = event.files?.[0];
  if (!file) return;
  const problem = checkFile(file);
  if (problem) {
    localErrors[id] = problem;
    return;
  }
  delete localErrors[id];
  emit("select", id, file);
}

function reuse(doc, s) {
  delete localErrors[doc.id];
  emit("reuse", doc.id, s.file);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="!docs.length" class="text-sm text-slate-500">Surat ini tidak membutuhkan dokumen pendukung. Silakan lanjut.</p>

    <div v-for="d in docs" :key="d.id" class="flex flex-col gap-1.5">
      <label class="text-sm text-slate-800">
        {{ d.label }}<span v-if="d.optional" class="text-slate-500"> (opsional)</span>
      </label>

      <div
        class="rounded-xl border-2 border-dashed p-4 transition-colors"
        :class="errorOf(d.id) ? 'border-red-300 bg-red-50' : files[d.id] ? 'border-emerald-300 bg-emerald-50' : 'border-primary-300 bg-primary-50/60'"
      >
        <div v-if="files[d.id]" class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <FileThumb :file="files[d.id]" class="h-14 w-14" />
            <div class="min-w-0">
              <p class="truncate text-sm font-medium text-slate-800">{{ files[d.id].name }}</p>
              <p class="text-xs text-slate-500">{{ fileSizeLabel(files[d.id]) }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <Button label="Lihat" icon="pi pi-eye" size="small" severity="secondary" outlined @click="openPreview(d)" />
            <Button icon="pi pi-times" text rounded severity="danger" aria-label="Hapus dokumen" @click="emit('remove', d.id)" />
          </div>
        </div>

        <div v-else class="flex flex-col items-center gap-2 py-2 text-center">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200 text-primary-700"><i class="pi pi-cloud-upload text-lg" /></span>
          <FileUpload
            mode="basic"
            :name="`doc-${d.id}`"
            accept="image/*,.pdf"
            chooseLabel="Pilih Dokumen"
            chooseIcon="pi pi-upload"
            :auto="false"
            :customUpload="true"
            class="[&_input[type='file']]:hidden"
            @select="onSelect(d.id, $event)"
          />
          <p class="text-xs text-slate-500">JPG, PNG, atau PDF · maksimal {{ MAX_FILE_MB }} MB</p>
          <Button
            v-if="suggest && suggest(d)"
            type="button"
            size="small"
            text
            icon="pi pi-copy"
            :label="`Pakai file yang sama dari ${suggest(d).title}`"
            @click="reuse(d, suggest(d))"
          />
        </div>
      </div>
      <small v-if="errorOf(d.id)" class="text-red-500">{{ errorOf(d.id) }}</small>
    </div>
  
    <FilePreviewDialog v-model="preview.open" :file="preview.file" :title="preview.title" />
  </div>
</template>
