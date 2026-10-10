<script setup>
/* Pop-up pratinjau dokumen (gambar / PDF) memakai PrimeVue Dialog.
   Pakai: <FilePreviewDialog v-model="open" :file="file" :title="label" /> */
import { computed, onBeforeUnmount, ref, watch } from "vue";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import { canPreviewImage, isPdf } from "./filePreview";
import { fileSizeLabel } from "./formLogic";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  file: { type: Object, default: null },
  title: { type: String, default: "Pratinjau Dokumen" },
});
const emit = defineEmits(["update:modelValue"]);

const visible = computed({ get: () => props.modelValue, set: (v) => emit("update:modelValue", v) });

const url = ref("");
const release = () => {
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = "";
};
watch(
  () => [props.modelValue, props.file],
  ([open, f]) => {
    release();
    if (open && f) url.value = URL.createObjectURL(f);
  },
  { immediate: true },
);
onBeforeUnmount(release);

const kind = computed(() => (!props.file ? "none" : canPreviewImage(props.file) ? "image" : isPdf(props.file) ? "pdf" : "other"));
</script>

<template>
  <Dialog v-model:visible="visible" modal dismissableMask :draggable="false" :header="title" :style="{ width: '56rem', maxWidth: '95vw' }">
    <div v-if="file" class="flex flex-col gap-3">
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <i class="pi pi-paperclip" />
        <span class="truncate font-medium text-slate-800">{{ file.name }}</span>
        <span class="shrink-0">· {{ fileSizeLabel(file) }}</span>
      </div>

      <div v-if="kind === 'image'" class="flex max-h-[70vh] items-center justify-center overflow-auto rounded-2xl border border-primary-200 bg-primary-50/60 p-2">
        <img :src="url" :alt="file.name" class="max-h-[66vh] max-w-full rounded-xl object-contain" />
      </div>

      <iframe v-else-if="kind === 'pdf'" :src="url" :title="file.name" class="h-[70vh] w-full rounded-2xl border border-primary-200 bg-white" />

      <div v-else class="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
        <i class="pi pi-file text-3xl text-slate-400" />
        <p class="text-sm text-slate-800">Format file ini tidak bisa dipratinjau di browser.</p>
        <p class="text-xs text-slate-500">Buka lewat tombol di bawah untuk memeriksanya.</p>
      </div>
    </div>

    <template #footer>
      <Button v-if="url" as="a" :href="url" target="_blank" rel="noopener" label="Buka di tab baru" icon="pi pi-external-link" severity="secondary" outlined />
      <Button label="Tutup" icon="pi pi-times" @click="visible = false" />
    </template>
  </Dialog>
</template>
