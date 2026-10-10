<script setup>
/* Katalog surat untuk Tambah Surat (search + tab kategori + grid kartu pastel).
   Disalin dari public (LetterCatalog.vue), tanpa hero & tanpa route: pilihan kategori disimpan di komponen. */
import { computed, ref } from "vue";
import InputText from "primevue/inputtext";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import ServiceCard from "./ServiceCard.vue";
import { HUES, hueForCategory } from "./pastel";

const props = defineProps({
  services: { type: Array, required: true },
  categories: { type: Array, required: true }, // [{ value, label }]
  searchPlaceholder: { type: String, default: "Ketik jenis surat..." },
});
const emit = defineEmits(["select"]);

const searchQuery = ref("");
const activeCategory = ref(props.categories[0]?.value ?? null);

// warna kategori seragam: permohonan = biru, keterangan = pink, dst. (lihat CATEGORY_HUES di pastel.js)
const hueOfCategory = (category) => hueForCategory(category.value, category.label);
const tabHue = (category) => HUES[hueOfCategory(category)];
const cardHue = (service) => hueForCategory(service.category, props.categories.find((c) => c.value === service.category)?.label);

const countOf = (value) => props.services.filter((s) => s.category === value).length;

const filtered = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  return props.services.filter((s) => {
    const okCategory = s.category === activeCategory.value;
    const okKeyword = !keyword
      || s.title.toLowerCase().includes(keyword)
      || (s.shortCode ?? "").toLowerCase().includes(keyword)
      || s.description.toLowerCase().includes(keyword)
      || (s.keywords ?? []).some((k) => k.toLowerCase().includes(keyword));
    return okCategory && okKeyword;
  });
});
</script>

<template>
  <div>
    <!-- Search -->
    <div class="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <label class="text-sm font-semibold text-slate-800 flex items-center gap-2" for="letter-search">
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700"><i class="pi pi-search text-xs" /></span>
        Cari Surat
      </label>
      <IconField class="mt-3 block">
        <InputIcon class="pi pi-search" />
        <InputText
          id="letter-search"
          v-model="searchQuery"
          class="w-full !border-slate-300 focus:!border-primary-500 !rounded-xl !py-3 !bg-white"
          :placeholder="searchPlaceholder"
        />
      </IconField>
    </div>

    <!-- Tab kategori -->
    <div class="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3" role="group" aria-label="Kategori surat">
      <button
        v-for="category in categories"
        :key="category.value"
        type="button"
        class="w-full sm:w-auto min-w-0 truncate rounded-full border-2 px-4 py-2 text-center text-sm font-medium leading-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 sm:px-5"
        :class="activeCategory === category.value ? tabHue(category).chipOn : tabHue(category).chipOff"
        :aria-pressed="activeCategory === category.value"
        @click="activeCategory = category.value"
      >
        {{ category.label }}
        <span class="ml-1 text-xs opacity-70">{{ countOf(category.value) }}</span>
      </button>
    </div>

    <!-- Grid -->
    <div v-if="filtered.length" class="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <ServiceCard v-for="s in filtered" :key="s.slug" :service="s" :hue="cardHue(s)" @select="emit('select', $event)" />
    </div>

    <div v-else class="mt-6 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <i class="pi pi-inbox text-2xl text-slate-400" />
      <p class="mt-3 text-sm text-slate-500">Tidak ada surat yang cocok dengan pencarian atau kategori ini.</p>
    </div>
  </div>
</template>
