<script setup>
/* Wizard PAKET surat (banyak surat dalam 1 pengajuan) versi admin. Langkah & isian sama dengan public.
   Dipakai juga oleh Pendaftaran Warga Baru lewat `bundle.ui` (teks). 4 langkah tetap, berapa pun surat yang dipilih
   (bila hanya ada 1 pilihan surat, langkah 1 dilewati: langsung masuk ke isian, jadi 3 langkah):
   1) Pilih Surat      : ceklis surat yang dibutuhkan (dilewati bila hanya 1 pilihan)
   2) Isian Surat      : diawali pencarian NIK pemohon (data warga mengisi formulir otomatis), lalu isian KHUSUS tiap surat terpilih.
                         Step di dalam step: 1 surat = 1 halaman, lanjut ke surat berikutnya (tidak scroll panjang)
   3) Verifikasi & Otorisasi (tidak ada langkah upload dokumen; berkas fisik dapat diserahkan langsung ke kalurahan).
   Dari langkah Isian + pernyataan dokumen asli, tombol "Lanjut ke Verifikasi & Otorisasi"
                         (tanpa tombol/pop-up Kirim) langsung membuka halaman Verifikasi + Otorisasi (route `letter-detail`;
                         halaman itu membuka surat pertama, surat lainnya ada di daftar)

   Isian dipakai bersama antar surat: kunci field yang sama (dan pasangan kunci di `bundle.aliases`)
   terisi otomatis dari surat di atasnya, tetap bisa direvisi. */
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";
import Message from "primevue/message";
import LetterFormFields from "./LetterFormFields.vue";
import WizardStepper from "./WizardStepper.vue";
import ApplicantLookup from "./ApplicantLookup.vue";
import { useApplicantLookup } from "./useApplicantLookup";
import { applicantOf, applyAliases, buildAliasIndex, fillForm, reviewLocation, scrollTop, validateFields, focusFirstInvalid } from "./formLogic";
import { HUES, SECTION_HUES, hue } from "./pastel";
import { LETTER_SOURCE, getLetterRequestError, submitLetterBundle } from "@/services/letter-create.service";

const props = defineProps({
  bundle: { type: Object, required: true }, // lihat data/letterBundles.js
  hue: { type: String, default: "" }, // warna kategori (permohonan = biru); kosong → warna bawaan paket
});

const emit = defineEmits(["back", "restart"]);

const router = useRouter();
const ui = computed(() => props.bundle.ui ?? {}); // penyesuaian teks/navigasi (dipakai register); kosong = tampilan paket
const hueName = computed(() => props.hue || props.bundle.hue);
const h = computed(() => hue(hueName.value));
// Pendaftaran warga baru dimulai dari data manual karena NIK pemohon memang
// belum tentu sudah tersimpan di tabel citizens. Paket surat biasa tetap
// menggunakan pencarian NIK untuk autofill.

/* ---------- Data bersama ---------- */
const NOTIF_SECTION = {
  title: "Kontak Pemohon",
  hint: "Opsional. Pemohon datang langsung ke kalurahan, jadi tidak ada notifikasi WhatsApp yang dikirim.",
  fields: [{ key: "whatsapp", label: "Nomor Telepon / WhatsApp", type: "text", from: "phoneNumber", placeholder: "08xx-xxxx-xxxx", optional: true }],
};
const aliasIndex = buildAliasIndex(props.bundle.aliases);

const form = reactive({});
fillForm(form, [...props.bundle.letters.flatMap((l) => l.sections), NOTIF_SECTION]);

const autoFilled = reactive({}); // { [fieldKey]: true } — penanda "terisi otomatis"
const lookup = useApplicantLookup(); // pencarian pemohon lewat NIK (langkah Isian, surat pertama)
const errors = ref({});
const stepAlert = ref("");

/* ---------- Surat terpilih → langkah ---------- */
/* Hanya 1 pilihan surat (kartu yang tampil) → tidak perlu ceklis: langsung masuk ke isian dengan surat itu (beserta
   surat pendampingnya, lihat `with`) sudah terpilih. Stepper pun hanya menampilkan 3 langkah. */
const hasChecklist = props.bundle.letters.filter((l) => !l.hidden).length > 1;
const selected = ref(hasChecklist ? [...(props.bundle.ui?.preselected ?? [])].filter((id) => props.bundle.letters.some((l) => l.id === id)) : props.bundle.letters.map((l) => l.id));
const selectError = ref(false);
const selectedLetters = computed(() => props.bundle.letters.filter((l) => selected.value.includes(l.id)));
const selectedVisibleCount = computed(() => props.bundle.letters.filter((l) => !l.hidden && selected.value.includes(l.id)).length);
const requiresDualCatinLookup = computed(() => selectedLetters.value.some((letter) => {
  const lookupKeys = new Set((letter.sections ?? []).filter((section) => section.lookupKey).map((section) => section.lookupKey));
  return (lookupKeys.has("groom") && lookupKeys.has("bride")) || (lookupKeys.has("child") && lookupKeys.has("childSpouse"));
}));
// Bila surat pertama sudah punya dua blok catin (mis. FPN/DPN), tiap catin dicari dari kotak NIK-nya sendiri.
const firstHasDualCatin = computed(() => {
  const keys = new Set((selectedLetters.value[0]?.sections ?? []).filter((s) => s.lookupKey).map((s) => s.lookupKey));
  return keys.has("groom") && keys.has("bride");
});
const showApplicantLookup = computed(() => !ui.value.hideApplicantLookup && !firstHasDualCatin.value && (selectedVisibleCount.value > 1 || !requiresDualCatinLookup.value));
const sectionsOf = (letter) => (letter.id === selectedLetters.value[0]?.id ? [...letter.sections, NOTIF_SECTION] : letter.sections);

const applicantLookupSections = computed(() => {
  const allSections = selectedLetters.value.flatMap(sectionsOf);
  if (!requiresDualCatinLookup.value) return allSections;
  const primaryLookupKey = allSections.find((section) =>
    section.lookupKey === "groom" || section.lookupKey === "bride" || section.lookupKey === "child" || section.lookupKey === "spouse"
  )?.lookupKey;
  if (!primaryLookupKey) return allSections;
  const excludedPrefixes = primaryLookupKey === "groom"
    ? ["bride", "spouse", "childSpouse"]
    : ["groom", "spouse", "childSpouse"];
  return allSections.filter((section) =>
    !section.fields.some((field) => excludedPrefixes.some((prefix) => field.key.startsWith(prefix))) &&
    (!section.lookupKey || section.lookupKey === primaryLookupKey) &&
    (!section.parentOf || section.parentOf === primaryLookupKey)
  );
});
const STEPS = ["Pilih Surat", "Isian Surat"];
const STEP_SELECT = 0;
const STEP_FIELDS = 1;
const FIRST_STEP = hasChecklist ? STEP_SELECT : STEP_FIELDS; // tanpa ceklis, stepper mulai dari "Isian Surat"
const stepLabels = STEPS.slice(FIRST_STEP);
const current = ref(FIRST_STEP);
const maxReached = ref(FIRST_STEP);
const isChecklist = computed(() => current.value === STEP_SELECT);
const isFields = computed(() => current.value === STEP_FIELDS);

// sub-langkah: indeks surat yang sedang tampil pada langkah Isian
const fieldIdx = ref(0);
const fLetter = computed(() => selectedLetters.value[Math.min(fieldIdx.value, selectedLetters.value.length - 1)] ?? null);
const lastIdx = computed(() => selectedLetters.value.length - 1);

const groups = computed(() => {
  const map = new Map();
  for (const l of props.bundle.letters) {
    if (l.hidden) continue; // surat pendamping (lihat `with`): tidak punya kartu sendiri
    if (!map.has(l.group)) map.set(l.group, []);
    map.get(l.group).push(l);
  }
  return [...map.entries()].map(([title, letters]) => ({ title, letters }));
});
const groupHue = (gi) => HUES[SECTION_HUES[(gi + 1) % SECTION_HUES.length]];
// surat boleh punya warna sendiri (`hue`), mis. kartu dokumen di register; bila tidak, ikut warna kelompoknya
const cardHue = (l, gi) => (l.hue ? hue(l.hue) : groupHue(gi));
const isSelected = (id) => selected.value.includes(id);
/* Satu kartu bisa membawa surat pendamping: letter.with = [id, ...] (surat pendamping diberi hidden: true).
   Memilih kartu = memilih semuanya; tiap surat tetap punya langkah isian sendiri. */
function toggle(id) {
  selectError.value = false;
  const ids = [id, ...(props.bundle.letters.find((l) => l.id === id)?.with ?? [])];
  selected.value = isSelected(id) ? selected.value.filter((x) => !ids.includes(x)) : [...new Set([...selected.value, ...ids])];
}
const visibleLetters = computed(() => props.bundle.letters.filter((l) => !l.hidden));
const visibleSelected = computed(() => visibleLetters.value.filter((l) => selected.value.includes(l.id)).length);
const selectAll = () => {
  selectError.value = false;
  selected.value = props.bundle.letters.map((l) => l.id);
};
const clearAll = () => (selected.value = []);

/* ---------- Navigasi ---------- */
function resetAlerts() {
  errors.value = {};
  stepAlert.value = "";
}

/* Pindah langkah utama. `letterId` (opsional) = surat yang ditampilkan pada langkah Isian/Dokumen. */
function goTo(step, letterId = null) {
  if (step !== current.value) resetAlerts();
  current.value = step;
  maxReached.value = Math.max(Math.min(maxReached.value, STEPS.length - 1), step);
  const idx = letterId ? Math.max(0, selectedLetters.value.findIndex((l) => l.id === letterId)) : 0;
  if (step === STEP_FIELDS) fieldIdx.value = idx;
  scrollTop();
}
// pindah surat di dalam langkah yang sama
function goSub(idx) {
  resetAlerts();
  fieldIdx.value = idx;
  scrollTop();
}

// isi otomatis field yang masih kosong dari surat lain setiap kali sebuah surat ditampilkan
watch([current, fieldIdx], () => {
  const l = isFields.value ? fLetter.value : null;
  if (!l) return;
  for (const key of applyAliases(form, sectionsOf(l), aliasIndex)) autoFilled[key] = true;
});

const nextLabel = computed(() => {
  if (isChecklist.value) return `Lanjut (${selected.value.length} surat)`;
  if (fieldIdx.value < lastIdx.value) return `Lanjut ke ${selectedLetters.value[fieldIdx.value + 1].code}`;
  return ui.value.submitLabel ?? "Lanjut ke Verifikasi & Otorisasi";
});

// true bila tombol Kembali keluar dari wizard (ke daftar surat / jenis pendaftaran)
const leavesWizard = computed(() => isChecklist.value || (!hasChecklist && isFields.value && fieldIdx.value === 0));

function back() {
  if (leavesWizard.value) return emit("back");
  if (isFields.value) {
    if (fieldIdx.value > 0) return goSub(fieldIdx.value - 1);
    return hasChecklist ? goTo(STEP_SELECT) : emit("back");
  }
}

const focusFirstError = (letter) => nextTick(() => focusFirstInvalid(Object.keys(validateFields(sectionsOf(letter), form))));

function next() {
  if (isChecklist.value) {
    if (!selected.value.length) {
      selectError.value = true;
      return;
    }
    return goTo(STEP_FIELDS);
  }
  if (isFields.value) {
    const l = fLetter.value;
    if (Object.keys(fieldErrorsOf(l)).length) {
      errors.value = { _checked: true };
      stepAlert.value = `Masih ada isian wajib yang belum lengkap pada surat ${l.code}.`;
      return focusFirstError(l);
    }
    if (fieldIdx.value < lastIdx.value) return goSub(fieldIdx.value + 1);
    // surat terakhir: pastikan tidak ada surat sebelumnya yang terlewat (bisa loncat lewat penanda)
    const bad = selectedLetters.value.findIndex((x) => Object.keys(fieldErrorsOf(x)).length);
    if (bad >= 0) {
      goSub(bad);
      errors.value = { _checked: true };
      stepAlert.value = `Surat ${selectedLetters.value[bad].code} belum lengkap. Lengkapi dulu sebelum lanjut.`;
      return focusFirstError(selectedLetters.value[bad]);
    }
    return checkAndSubmit();
  }
}

/* ---------- Isian ---------- */
const onEdit = (key) => delete autoFilled[key];
// error ditampilkan hanya setelah pengguna menekan "Lanjut" (errors._checked), dihitung per surat
const fieldErrorsOf = (letter) => validateFields(sectionsOf(letter), form);
const shownErrors = (letter) => (errors.value._checked ? fieldErrorsOf(letter) : {});
const autoCount = computed(() => {
  const keys = new Set(selectedLetters.value.flatMap((l) => sectionsOf(l).flatMap((s) => s.fields)).map((f) => f.key));
  return [...keys].filter((k) => autoFilled[k]).length;
});

/* ---------- Cek ulang ---------- */
const visibleSections = (l) => sectionsOf(l).map((s) => ({ ...s, fields: s.fields.filter((f) => !f.showIf || f.showIf(form)) })).filter((s) => s.fields.length);

const status = computed(() =>
  Object.fromEntries(
    selectedLetters.value.map((l) => {
      const fe = Object.keys(validateFields(sectionsOf(l), form)).length;
      return [l.id, { ok: !fe, fields: fe }];
    }),
  ),
);
const incomplete = computed(() => selectedLetters.value.filter((l) => !status.value[l.id].ok));

const isOriginal = ref(false);
const confirmError = ref(false);

function checkAndSubmit() {
  if (incomplete.value.length) {
    // pengaman: isian sudah divalidasi di langkah Isian, tapi bila ada surat yang masih kurang, kembali ke surat tersebut
    goTo(STEP_FIELDS, incomplete.value[0].id);
    errors.value = { _checked: true };
    stepAlert.value = `Surat ${incomplete.value[0].code} belum lengkap. Lengkapi dulu sebelum lanjut.`;
    return focusFirstError(incomplete.value[0]);
  }
  stepAlert.value = "";
  if (!isOriginal.value) {
    confirmError.value = true;
    return;
  }
  submit(); // tanpa pop-up konfirmasi: langsung lanjut ke Verifikasi + Otorisasi
}

/* ---------- Kirim ---------- */
const isSubmitting = ref(false);

// Payload per surat = nilai field milik surat itu + file miliknya. Disimpan lewat
// (services/letter-create.service.js): backend yang membuat kode surat dan men-generate PDF per surat.
function buildPayload() {
  return {
    source: LETTER_SOURCE,
    bundle: props.bundle.slug,
    letters: selectedLetters.value.map((l) => ({
      id: l.id,
      // Kode pada paket adalah kode tampilan lama (contoh KHN). Kirim slug
      // supaya service selalu menerjemahkannya ke kode letter_types backend.
      slug: l.slug,
      code: l.code,
      title: l.title,
      applicant: lookup.withApplicant(applicantOf(sectionsOf(l), form)),
      fields: Object.fromEntries(sectionsOf(l).flatMap((s) => s.fields).map((f) => [f.key, form[f.key]])),
      fieldDefinitions: sectionsOf(l).flatMap((s) => s.fields.map(({ key, label }) => ({ key, label, section: s.title }))),
      files: [],
    })),
  };
}
async function submit() {
  isSubmitting.value = true;
  stepAlert.value = "";
  try {
    const res = await submitLetterBundle(buildPayload());
    // Langsung ke halaman gabungan Verifikasi + Otorisasi (service menjamin semua `id` terisi atau melempar error).
    router.push(reviewLocation(res.codes.map((c) => c.id)));
  } catch (err) {
    stepAlert.value = getLetterRequestError(err, "Terjadi kesalahan saat menyimpan pengajuan.");
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Hero -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 sm:p-7 border border-white shadow-sm" :class="h.hero">
      <span class="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full" :class="h.blob" />
      <span class="pointer-events-none absolute right-16 -bottom-10 h-24 w-24 rounded-full bg-white/60" />
      <div class="relative flex items-start gap-4">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl shadow-sm" :class="h.icon"><i :class="bundle.icon" /></span>
        <div class="min-w-0">
          <p class="text-xs font-medium uppercase tracking-wide" :class="h.text">{{ ui.kindLabel ?? "Paket Pengajuan Surat" }}</p>
          <h1 class="text-xl font-semibold text-slate-800 mt-0.5">{{ bundle.title }}</h1>
          <p class="text-sm mt-1 text-slate-500">{{ bundle.description }}</p>
        </div>
      </div>
    </div>

    <!-- Stepper -->
    <div class="mt-6 rounded-2xl border bg-white px-4 py-4" :class="h.soft">
      <WizardStepper :steps="stepLabels" :current="current - FIRST_STEP" :maxReached="maxReached - FIRST_STEP" :hue="hueName" @go="(i) => goTo(i + FIRST_STEP)" />
    </div>

    <div class="mt-4 rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
      <!-- ============ LANGKAH 1: CEKLIS SURAT ============ -->
      <div v-if="isChecklist">
        <h2 class="text-lg font-semibold text-slate-800">{{ ui.selectTitle ?? "Surat apa saja yang dibutuhkan pemohon?" }}</h2>
        <p class="text-sm mt-1 text-slate-500">
          {{ ui.selectHint ?? "Centang semua surat yang ingin diajukan. Setiap surat yang dipilih mendapat satu langkah pengisian sendiri." }}
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <Button label="Pilih semua" icon="pi pi-check-square" size="small" severity="secondary" outlined @click="selectAll" />
          <Button label="Kosongkan" icon="pi pi-times" size="small" severity="secondary" text :disabled="!selected.length" @click="clearAll" />
          <span class="ml-auto rounded-full px-3 py-1 text-xs font-semibold" :class="h.pill">{{ visibleSelected }} dari {{ visibleLetters.length }} surat dipilih</span>
        </div>

        <div v-for="(g, gi) in groups" :key="g.title" class="mt-6">
          <div class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 rounded-full" :class="groupHue(gi).dot" />
            <p class="text-sm font-semibold text-slate-800">{{ g.title }}</p>
          </div>
          <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              v-for="l in g.letters"
              :key="l.id"
              class="relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
              :class="isSelected(l.id) ? cardHue(l, gi).selected : cardHue(l, gi).idle"
            >
              <Checkbox :modelValue="isSelected(l.id)" binary class="mt-0.5" @update:modelValue="toggle(l.id)" />
              <span class="min-w-0 flex-1">
                <span class="flex items-center gap-2">
                  <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide" :class="cardHue(l, gi).icon"><i v-if="l.icon" :class="l.icon" class="text-[10px]" />{{ l.cardCode ?? l.code }}</span>
                  <span class="text-sm font-semibold text-slate-800">{{ l.cardTitle ?? l.title }}</span>
                </span>
                <span class="block text-xs mt-1 text-slate-500">{{ l.cardDescription ?? l.description }}</span>
              </span>
            </label>
          </div>
        </div>

        <Message v-if="selectError" severity="warn" :closable="false" class="mt-5">Pilih minimal satu surat untuk melanjutkan.</Message>
      </div>

      <!-- ============ LANGKAH 2: ISIAN — 1 SURAT PER HALAMAN ============ -->
      <div v-else-if="isFields && fLetter" :key="`f-${fLetter.id}`">
        <!-- Langkah pertama: NIK pemohon → data warga mengisi formulir semua surat terpilih -->
        <ApplicantLookup v-if="showApplicantLookup && fieldIdx === 0" :state="lookup.state" class="mb-5" @search="lookup.search(applicantLookupSections, form, autoFilled)" />

        <!-- penanda sub-langkah per surat -->
        <div v-if="selectedLetters.length > 1" class="flex flex-wrap items-center gap-2">
          <button
            v-for="(l, i) in selectedLetters"
            :key="l.id"
            type="button"
            class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors"
            :class="i === fieldIdx ? h.icon : Object.keys(fieldErrorsOf(l)).length ? 'bg-white border-slate-200 text-slate-500' : 'bg-emerald-50 border-emerald-200 text-emerald-700'"
            :aria-current="i === fieldIdx ? 'step' : undefined"
            :title="l.title"
            @click="goSub(i)"
          >
            <i v-if="i !== fieldIdx && !Object.keys(fieldErrorsOf(l)).length" class="pi pi-check text-[9px]" />
            {{ l.code }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2" :class="selectedLetters.length > 1 ? 'mt-4' : ''">
          <span class="rounded-md px-2 py-0.5 text-xs font-bold tracking-wide" :class="h.icon">{{ fLetter.code }}</span>
          <span v-if="selectedLetters.length > 1" class="text-xs text-slate-500">Isian surat {{ fieldIdx + 1 }} dari {{ selectedLetters.length }}</span>
        </div>
        <h2 class="text-lg font-semibold text-slate-800 mt-1">{{ fLetter.title }}</h2>
        <p class="text-sm mt-1 text-slate-500">{{ fLetter.description }}</p>

        <div v-if="sectionsOf(fLetter).flatMap((s) => s.fields).some((f) => autoFilled[f.key])" class="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-800">
          <i class="pi pi-bolt mt-0.5" />
          <span>Sebagian isian terisi otomatis dari data warga / surat sebelumnya. Periksa dan ubah bila perlu.</span>
        </div>

        <div class="mt-5">
          <LetterFormFields :sections="sectionsOf(fLetter)" :form="form" :errors="shownErrors(fLetter)" :autoFilled="autoFilled" :idPrefix="`f-${fLetter.id}`" @edit="onEdit" />
        </div>

      </div>

      <!-- Pernyataan dipindahkan langsung ke bawah isian surat terakhir. -->
      <div v-if="isFields && fieldIdx === lastIdx" class="mt-6 rounded-2xl border-2 p-4" :class="confirmError && !isOriginal ? 'border-red-300 bg-red-50' : h.soft">
        <label class="flex items-start gap-3 cursor-pointer">
          <Checkbox v-model="isOriginal" binary class="mt-0.5" @update:modelValue="confirmError = false" />
          <span class="text-sm text-slate-800">
            Saya menyatakan bahwa seluruh data yang saya input sudah sesuai dengan berkas dari pemohon dan dokumen yang diserahkan pemohon (berkas fisik) adalah <b>dokumen asli</b>.
          </span>
        </label>
        <small v-if="confirmError && !isOriginal" class="block mt-2 text-red-500">Centang pernyataan ini sebelum melanjutkan.</small>
      </div>

      <Message v-if="stepAlert" severity="error" :closable="false" class="mt-5">{{ stepAlert }}</Message>

      <!-- Tombol navigasi -->
      <div class="flex justify-between gap-3 mt-7 pt-6 border-t border-slate-200">
        <Button :label="leavesWizard ? (ui.backLabel ?? 'Kembali ke Daftar Surat') : 'Kembali'" icon="pi pi-arrow-left" severity="secondary" outlined :disabled="isSubmitting" @click="back" />
        <Button
          :label="nextLabel"
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