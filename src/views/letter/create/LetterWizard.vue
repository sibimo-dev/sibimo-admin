<script setup>
/* Wizard tambah 1 surat (admin). Langkah & isian sama dengan public (LetterWizard.vue di layanan mandiri):
   1) Isian surat (diawali pencarian NIK pemohon)   2) Dokumen pendukung (opsional) + pernyataan dokumen asli
   Tidak ada langkah cek/preview dan tidak ada tombol/pop-up "Kirim": dari langkah dokumen, tombol
   "Lanjut ke Verifikasi & Otorisasi" menyimpan pengajuan lalu langsung membuka halaman Verifikasi + Otorisasi
   (route `letter-detail`) yang menampilkan preview surat. Bila penyimpanan
   gagal, pesan error tampil inline di langkah dokumen (tanpa pop-up).
   Penyimpanan ke backend: lihat services/letter-create.service.js (asumsi kontrak ada di komentar file itu). */
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Message from "primevue/message";
import LetterFormFields from "./LetterFormFields.vue";
import DocUploader from "./DocUploader.vue";
import WizardStepper from "./WizardStepper.vue";
import ApplicantLookup from "./ApplicantLookup.vue";
import { useApplicantLookup } from "./useApplicantLookup";
import { applicantOf, fillForm, normalizeDocs, reviewLocation, scrollTop, validateDocs, validateFields, MAX_FILE_MB } from "./formLogic";
import { hue as getHue } from "./pastel";
import { LETTER_SOURCE, getLetterRequestError, submitSingleLetter } from "@/services/letter-create.service";

const props = defineProps({
  title: { type: String, required: true },
  code: { type: String, default: "SRT" }, // awalan kode surat, contoh: SKTM
  slug: { type: String, default: "" }, // slug berkas surat → dipetakan ke kode tipe surat backend
  sections: { type: Array, required: true }, // lihat data/letterFields.js
  documents: { type: [Array, Function], default: () => [] }, // "Nama dokumen", { label, optional }, atau fungsi dinamis (form) => []
  hue: { type: String, default: "violet" },
  internal: { type: Boolean, default: false }, // surat internal kantor (Perintah/Balasan): kontak WhatsApp tidak wajib
});
const emit = defineEmits(["back", "restart"]);

const STEPS = ["Isian Surat", "Dokumen Pendukung"];
const h = computed(() => getHue(props.hue));
const router = useRouter();

/* ---------- Data ---------- */
// Kontak pemohon opsional di semua surat (admin: pemohon datang sendiri, tanpa notifikasi WhatsApp).
const allSections = computed(() => [
  ...props.sections,
  {
    title: "Kontak Pemohon",
    hint: "Opsional. Pemohon datang langsung ke kalurahan, jadi tidak ada notifikasi WhatsApp yang dikirim.",
    fields: [{ key: "whatsapp", label: "Nomor Telepon / WhatsApp", type: "text", from: "phoneNumber", placeholder: "08xx-xxxx-xxxx", optional: true }],
  },
]);

const form = reactive({});
fillForm(form, allSections.value);

// Dipakai template (ApplicantLookup & LetterFormFields) dan buildPayload(). Tanpa 3 baris ini halaman gagal tampil
// ("Property lookup was accessed during render but is not defined").
const autoFilled = reactive({}); // { [fieldKey]: true } — penanda "terisi otomatis" (dari pencarian NIK)
const onEdit = (key) => delete autoFilled[key];
const lookup = useApplicantLookup();

const docList = computed(() => normalizeDocs(props.documents, "", form));

const files = reactive({}); // { [indexDokumen]: File }
const errors = ref({});
const fileErrors = ref({});

function onFileSelect(id, file) {
  files[id] = file;
  const next = { ...fileErrors.value };
  delete next[id];
  fileErrors.value = next;
}

/* ---------- Langkah ---------- */
const current = ref(0);
const isFirst = computed(() => current.value === 0);
const isLast = computed(() => current.value === STEPS.length - 1);
const isOriginal = ref(false); // ceklis "dokumen asli"
const confirmError = ref(false);

function goTo(step) {
  current.value = step;
  scrollTop();
}

function back() {
  if (isFirst.value) emit("back");
  else goTo(current.value - 1);
}

function next() {
  if (current.value === 0) {
    errors.value = validateFields(allSections.value, form);
    if (Object.keys(errors.value).length) return;
    return goTo(1);
  }
  // langkah dokumen = langkah terakhir → langsung ke Verifikasi + Otorisasi
  fileErrors.value = validateDocs(docList.value, files);
  if (Object.keys(fileErrors.value).length) return;
  if (!isOriginal.value) {
    confirmError.value = true;
    return;
  }
  submit(); // tanpa pop-up konfirmasi: langsung lanjut ke Verifikasi + Otorisasi
}

/* ---------- Kirim ---------- */
const isSubmitting = ref(false);
const submitError = ref(""); // gagal simpan: pesan inline di bawah form, bukan pop-up

function buildPayload() {
  return {
    source: LETTER_SOURCE,
    code: props.code,
    slug: props.slug,
    title: props.title,
    applicant: lookup.withApplicant(applicantOf(allSections.value, form)),
    fields: Object.fromEntries(allSections.value.flatMap((s) => s.fields).map((f) => [f.key, form[f.key]])),
    fieldDefinitions: allSections.value.flatMap((s) => s.fields.map(({ key, label }) => ({ key, label, section: s.title }))),
    files: docList.value.filter((d) => files[d.id]).map((d) => ({ label: d.label, file: files[d.id] })),
  };
}

async function submit() {
  isSubmitting.value = true;
  submitError.value = "";
  try {
    const res = await submitSingleLetter(buildPayload());
    // Langsung ke halaman gabungan Verifikasi + Otorisasi (service menjamin `id` terisi atau melempar error).
    router.push(reviewLocation([res.id]));
  } catch (err) {
    submitError.value = getLetterRequestError(err, "Terjadi kesalahan saat menyimpan pengajuan.");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 border border-white shadow-sm" :class="h.hero">
      <span class="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full" :class="h.blob" />
      <span class="pointer-events-none absolute right-16 -bottom-10 h-24 w-24 rounded-full bg-white/60" />
      <p class="relative text-xs font-medium uppercase tracking-wide" :class="h.text">{{ internal ? "Surat Internal" : "Pengajuan Surat" }}</p>
      <h1 class="relative text-xl font-semibold text-slate-800 mt-1">{{ title }}</h1>
    </div>

    <div class="mt-6 rounded-2xl border bg-white px-4 py-4" :class="h.soft">
      <WizardStepper :steps="STEPS" :current="current" :hue="hue" @go="goTo" />
    </div>

    <div class="mt-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      <!-- ============ STEP 1: ISIAN SURAT ============ -->
      <div v-if="current === 0" class="flex flex-col gap-5">
        <!-- Langkah pertama: NIK pemohon → data warga mengisi formulir otomatis (surat internal tidak punya pemohon) -->
        <ApplicantLookup v-if="!internal" :state="lookup.state" @search="lookup.search(allSections, form, autoFilled)" />
        <LetterFormFields :sections="allSections" :form="form" :errors="errors" :autoFilled="autoFilled" @edit="onEdit" />
      </div>

      <!-- ============ STEP 2: DOKUMEN PENDUKUNG ============ -->
      <div v-else>
        <h2 class="text-lg font-semibold text-slate-800">Dokumen Pendukung</h2>
        <p class="text-sm mt-1 mb-6 text-slate-500">
          Unggah foto/scan dokumen asli (JPG, PNG, atau PDF, maksimal {{ MAX_FILE_MB }} MB per file). Langkah ini opsional: kosongkan bila pemohon menyerahkan berkas fisik langsung ke kantor kalurahan.
        </p>
        <DocUploader :docs="docList" :files="files" :errors="fileErrors" @select="onFileSelect" @remove="(id) => delete files[id]" />

        <!-- Pernyataan dokumen asli -->
        <div class="mt-6 rounded-2xl border-2 p-4" :class="confirmError && !isOriginal ? 'border-red-300 bg-red-50' : h.soft">
          <label class="flex items-start gap-3 cursor-pointer">
            <Checkbox v-model="isOriginal" binary class="mt-0.5" @update:modelValue="confirmError = false" />
            <span class="text-sm text-slate-800">
              Saya menyatakan bahwa seluruh data yang saya input sudah sesuai dengan berkas dari pemohon dan dokumen yang diserahkan pemohon (diunggah atau berkas fisik) adalah <b>dokumen asli</b>.
            </span>
          </label>
          <small v-if="confirmError && !isOriginal" class="block mt-2 text-red-500">Centang pernyataan ini sebelum melanjutkan.</small>
        </div>
      </div>

      <Message v-if="submitError" severity="error" :closable="false" class="mt-5">{{ submitError }}</Message>

      <!-- Tombol navigasi -->
      <div class="flex justify-between gap-3 mt-7 pt-6 border-t border-slate-200">
        <Button :label="isFirst ? 'Kembali ke Daftar Surat' : 'Kembali'" icon="pi pi-arrow-left" severity="secondary" outlined :disabled="isSubmitting" @click="back" />
        <Button
          :label="isLast ? 'Lanjut ke Verifikasi & Otorisasi' : 'Lanjut'"
          :icon="'pi pi-arrow-right'"
          iconPos="right"
          :class="h.btn"
          :loading="isSubmitting"
          @click="next"
        />
      </div>
    </div>
  </div>
</template>