<script setup>
/* Tambah Surat (admin). Isian & langkah mengikuti public (Layanan Mandiri), dibagi 2 kelompok:
   1) Pengajuan Surat        → katalog surat satuan + paket surat → wizard (1 surat: 3 langkah, paket: 4 langkah)
   2) Pendaftaran Warga Baru → pilih jenis pendaftaran → wizard paket (4 langkah)
   Isian tiap surat dibaca dari data/letters/<kelompok>/<slug>.js (salinan dari public).
   Pengiriman masih MOCK (services/letter-create.service.js, TODO(BE)): backend lama di halaman ini sengaja dilepas. */
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import AppButton from "@/components/common/AppButton.vue";
import LetterCatalog from "./create/LetterCatalog.vue";
import LetterWizard from "./create/LetterWizard.vue";
import BundleWizard from "./create/BundleWizard.vue";
import RegisterTypePicker from "./create/RegisterTypePicker.vue";
import { CATALOG_CATEGORIES, CATALOG_SERVICES, SINGLE_LETTERS } from "@/data/letterCatalog";
import { BUNDLES, findBundle } from "@/data/letterBundles";
import { buildRegisterBundle } from "@/data/registrationLetters";
import { CATEGORY_HUES, HUES, hueForCategory } from "./create/pastel";

const router = useRouter();

// groups | catalog | letter | bundle | register-type | register
const view = ref("groups");
const loading = ref(false);
const failed = ref(false);
const wizardKey = ref(0); // ganti key = wizard dimulai dari awal lagi

const letter = ref(null); // { title, code, sections, documents, hue, internal }
const bundle = ref(null);
const registerBundle = ref(null);

/* ---------- Kelompok ---------- */
const GROUPS = [
  {
    value: "catalog",
    hue: "sky",
    icon: "pi pi-file-edit",
    title: "Pengajuan Surat",
    description: "Surat satuan dan paket surat (nikah, kelahiran, kematian, Letter C, pindah WNI). Termasuk surat internal: Perintah (SPPD) dan Balasan.",
    stats: `${SINGLE_LETTERS.length} surat satuan · ${BUNDLES.length} paket surat`,
  },
  {
    value: "register-type",
    hue: "violet",
    icon: "pi pi-user-plus",
    title: "Pendaftaran Warga Baru",
    description: "Untuk pemohon yang belum terdaftar sebagai penduduk: penduduk tetap, penduduk sementara, atau tinggal sementara.",
    stats: "3 jenis pendaftaran",
  },
];
const group = (g) => HUES[g.hue];

const heading = computed(
  () =>
    ({
      groups: ["Tambah Surat", "Pilih kelompok surat yang akan ditambahkan."],
      catalog: ["Pengajuan Surat", "Pilih surat satuan atau paket surat, lalu isi formulirnya."],
      "register-type": ["Pendaftaran Warga Baru", "Pilih jenis pendaftaran, lalu isi formulir surat yang dibutuhkan."],
    })[view.value] ?? ["Tambah Surat", "Isi formulir sesuai surat yang dipilih."],
);
const headerBack = computed(() => (view.value === "groups" ? () => router.push("/letter") : view.value === "catalog" || view.value === "register-type" ? () => (view.value = "groups") : null));

/* ---------- Surat satuan / paket ---------- */
const letterModules = import.meta.glob("@/data/letters/*/*.js");

async function openService(service) {
  failed.value = false;
  if (service.bundle) {
    bundle.value = findBundle(service.slug);
    wizardKey.value++;
    view.value = "bundle";
    return;
  }
  loading.value = true;
  try {
    const path = Object.keys(letterModules).find((p) => p.endsWith(`/${service.group}/${service.slug}.js`));
    if (!path) throw new Error(`Berkas surat ${service.slug}.js tidak ditemukan`);
    const mod = await letterModules[path]();
    letter.value = {
      title: mod.meta?.title ?? service.title,
      code: mod.meta?.code ?? service.shortCode,
      sections: mod.sections,
      documents: mod.documents ?? [],
      hue: hueForCategory(service.category),
      internal: service.internal,
    };
    wizardKey.value++;
    view.value = "letter";
  } catch (err) {
    console.error("[letter-create] Gagal memuat surat:", err);
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

/* ---------- Pendaftaran warga baru ---------- */
async function openRegister(type) {
  failed.value = false;
  loading.value = true;
  try {
    registerBundle.value = await buildRegisterBundle({
      type: type.value,
      ui: {
        kindLabel: "Pendaftaran Warga Baru",
        selectTitle: "Surat apa saja yang dibutuhkan pemohon?",
        selectHint: "Pilih surat/dokumen kependudukan untuk mendaftar. Setiap surat yang dipilih mendapat satu langkah pengisian sendiri, termasuk data diri.",
        backLabel: "Kembali ke Jenis Pendaftaran",
        submitLabel: "Kirim Pendaftaran",
        confirmTitle: "Kirim Pendaftaran?",
        confirmText: "Apakah Anda yakin ingin mengirim pendaftaran warga baru sekarang?",
        confirmNote: "Setelah dikirim, pendaftaran akan masuk ke daftar surat untuk diperiksa dan disetujui.",
        confirmYes: "Ya, Kirim Pendaftaran",
        doneTitle: "Pendaftaran Terkirim",
        failTitle: "Pendaftaran Gagal",
        doneIntro: "Pendaftaran warga baru berhasil dikirim.",
        doneMessage: "Data pemohon menunggu pemeriksaan dan persetujuan.",
      },
    });
    wizardKey.value++;
    view.value = "register";
  } catch (err) {
    console.error("[letter-create] Gagal memuat surat pendaftaran:", err);
    failed.value = true;
  } finally {
    loading.value = false;
  }
}

/* ---------- Navigasi dari wizard ---------- */
const backFromWizard = () => (view.value = view.value === "register" ? "register-type" : "catalog");
// "Tambah Surat Lagi" setelah berhasil kirim → kembali ke daftar surat / jenis pendaftaran tadi
const restartWizard = backFromWizard;
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6 flex items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">{{ heading[0] }}</h1>
        <p class="text-sm text-slate-500 mt-1">{{ heading[1] }}</p>
      </div>
      <AppButton v-if="headerBack" label="Kembali" variant="outline" @click="headerBack" />
    </div>

    <Message v-if="failed" severity="error" :closable="false" class="mb-4">Formulir surat gagal dimuat. Muat ulang halaman ini lalu coba lagi.</Message>

    <div v-if="loading" class="flex justify-center p-10"><ProgressSpinner style="width: 2.5rem; height: 2.5rem" /></div>

    <template v-else>
      <!-- ============ PILIH KELOMPOK ============ -->
      <div v-if="view === 'groups'" class="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
        <button
          v-for="g in GROUPS"
          :key="g.value"
          type="button"
          class="group relative overflow-hidden text-left rounded-3xl border-2 p-6 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          :class="[group(g).card, group(g).cardHover]"
          @click="view = g.value"
        >
          <span class="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full transition-transform duration-300 group-hover:scale-125" :class="group(g).blob" />
          <span class="pointer-events-none absolute -right-2 bottom-4 h-12 w-12 rounded-full bg-white/50" />
          <span class="relative flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-sm" :class="group(g).icon"><i :class="g.icon" /></span>
          <div class="relative">
            <h2 class="text-lg font-semibold text-slate-800">{{ g.title }}</h2>
            <p class="text-sm mt-1 text-slate-500">{{ g.description }}</p>
          </div>
          <div class="relative mt-auto flex items-center justify-between pt-1">
            <span class="text-xs font-medium" :class="group(g).text">{{ g.stats }}</span>
            <span class="flex items-center gap-1 text-xs font-medium" :class="group(g).text">Pilih <i class="pi pi-arrow-right text-[10px]" /></span>
          </div>
        </button>
      </div>

      <!-- ============ KATALOG SURAT ============ -->
      <LetterCatalog
        v-else-if="view === 'catalog'"
        :services="CATALOG_SERVICES"
        :categories="CATALOG_CATEGORIES"
        searchPlaceholder="Ketik jenis surat (Cth: SKTM, Domisili, Nikah, SPPD)..."
        @select="openService"
      />

      <!-- ============ WIZARD 1 SURAT ============ -->
      <LetterWizard
        v-else-if="view === 'letter' && letter"
        :key="`letter-${wizardKey}`"
        :title="letter.title"
        :code="letter.code"
        :sections="letter.sections"
        :documents="letter.documents"
        :hue="letter.hue"
        :internal="letter.internal"
        @back="backFromWizard"
        @restart="restartWizard"
      />

      <!-- ============ WIZARD PAKET SURAT ============ -->
      <BundleWizard
        v-else-if="view === 'bundle' && bundle"
        :key="`bundle-${wizardKey}`"
        :bundle="bundle"
        :hue="CATEGORY_HUES.permohonan"
        @back="backFromWizard"
        @restart="restartWizard"
      />

      <!-- ============ PENDAFTARAN WARGA BARU ============ -->
      <RegisterTypePicker v-else-if="view === 'register-type'" :loading="loading" @select="openRegister" />

      <BundleWizard
        v-else-if="view === 'register' && registerBundle"
        :key="`register-${wizardKey}`"
        :bundle="registerBundle"
        @back="backFromWizard"
        @restart="restartWizard"
      />
    </template>
  </div>
</template>
