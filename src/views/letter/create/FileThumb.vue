<script setup>
/* Thumbnail kecil sebuah file: gambar → pratinjau gambarnya, PDF → ikon PDF, lainnya → ikon file.
   Object URL dibuat dan dilepas otomatis. */
import { onBeforeUnmount, ref, watch } from "vue";
import { canPreviewImage, isPdf } from "./filePreview";

const props = defineProps({ file: { type: Object, default: null } });

const url = ref("");
const release = () => {
  if (url.value) URL.revokeObjectURL(url.value);
  url.value = "";
};
watch(
  () => props.file,
  (f) => {
    release();
    if (f && canPreviewImage(f)) url.value = URL.createObjectURL(f);
  },
  { immediate: true },
);
onBeforeUnmount(release);
</script>

<template>
  <span class="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white bg-white shadow-sm">
    <img v-if="url" :src="url" :alt="file?.name" class="h-full w-full object-cover" />
    <i v-else-if="file && isPdf(file)" class="pi pi-file-pdf text-lg text-red-500" />
    <i v-else class="pi pi-file text-lg text-slate-500" />
  </span>
</template>
