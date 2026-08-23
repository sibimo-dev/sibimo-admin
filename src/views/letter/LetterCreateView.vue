<script setup>
/**
 * Halaman Tambah Surat (input manual oleh admin).
 * Dipakai saat warga mengajukan langsung ke kelurahan tanpa lewat form online.
 * Route: /letter/create
 *
 * Kategori & jenis surat di step 1-2 diambil dari useLetterTypeStore --
 * sumber data yang SAMA dengan yang dikelola di halaman Pengelolaan Tipe
 * Surat (LetterTypeListView.vue / ManageLetterType.vue). Hanya tipe surat
 * dengan is_active = true yang bisa dipilih di sini, karena tipe yang
 * nonaktif/draft belum boleh dipakai untuk membuat surat baru.
 *
 * Setelah step 3 (Data Pemohon) disubmit, surat tetap disimpan ke
 * useLetterStore (status Pending, sama seperti sebelumnya) supaya tercatat
 * di Pengelolaan Surat -- tapi alih-alih layar sukses biasa, admin langsung
 * diarahkan ke PREVIEW SURAT siap cetak (window.print()). Kop surat & isi
 * surat di preview masih placeholder/dummy; nanti bisa diganti pakai
 * blade_view dari backend atau data Profil Desa begitu tersedia.
 */
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import Tag from 'primevue/tag'
import { useLetterTypeStore } from '@/stores/useLetterTypeStore'
import { useLetterStore } from '@/stores/useLetterStore'

const router = useRouter()
const { rows: letterTypes } = useLetterTypeStore()
const { addSurat } = useLetterStore()

// Hanya tipe surat aktif yang boleh dipakai bikin surat baru
const activeTypes = computed(() => letterTypes.value.filter((t) => t.is_active))

// Kategori diturunkan otomatis dari tipe surat yang ada, bukan daftar statis --
// begitu ada kategori baru ditambahkan lewat Pengelolaan Tipe Surat, langsung muncul di sini.
const categories = computed(() => {
  const unique = [...new Set(activeTypes.value.map((t) => t.category))]
  return unique.map((cat) => ({
    key: cat,
    label: cat,
    count: activeTypes.value.filter((t) => t.category === cat).length,
  }))
})

// --- Step control ---
// 1 = pilih kategori, 2 = pilih jenis surat, 3 = isi form
const step = ref(1)

const selectedCategoryKey = ref('')
const selectedLetterTypeId = ref(null)

const typesInSelectedCategory = computed(() =>
  activeTypes.value.filter((t) => t.category === selectedCategoryKey.value),
)
const selectedLetterType = computed(() =>
  activeTypes.value.find((t) => t.letter_type_id === selectedLetterTypeId.value) || null,
)

function pickCategory(categoryKey) {
  selectedCategoryKey.value = categoryKey
  selectedLetterTypeId.value = null
  step.value = 2
}

function pickType(letterTypeId) {
  selectedLetterTypeId.value = letterTypeId
  step.value = 3
}

function goBack() {
  if (step.value === 1) {
    router.push('/letter')
  } else {
    step.value -= 1
  }
}

// --- Form data pemohon ---
const form = ref({
  citizenName: '',
  citizenId: '',
  phone: '',
  address: '',
  notes: '',
})

const errors = ref({})

function validateForm() {
  errors.value = {}
  if (!form.value.citizenName.trim()) errors.value.citizenName = 'Nama wajib diisi'
  if (!/^\d{16}$/.test(form.value.citizenId.trim())) {
    errors.value.citizenId = 'NIK harus 16 digit angka'
  }
  if (!form.value.address.trim()) errors.value.address = 'Alamat wajib diisi'
  return Object.keys(errors.value).length === 0
}

const isSubmitting = ref(false)
const submitted = ref(null)

// Tanggal cetak (dipakai di kop preview surat)
const printDate = computed(() =>
  submitted.value
    ? new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : '',
)

function submitForm() {
  if (!validateForm() || !selectedLetterType.value) return

  isSubmitting.value = true
  const created = addSurat({
    letterType: selectedLetterType.value,
    citizenId: form.value.citizenId.trim(),
    citizenName: form.value.citizenName.trim(),
    notes: form.value.notes.trim(),
  })
  isSubmitting.value = false
  submitted.value = created
}

function printLetter() {
  window.print()
}

function resetAndAddAnother() {
  step.value = 1
  selectedCategoryKey.value = ''
  selectedLetterTypeId.value = null
  form.value = { citizenName: '', citizenId: '', phone: '', address: '', notes: '' }
  submitted.value = null
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mb-6 flex items-center gap-3 print:hidden">
      <button
        class="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        @click="goBack"
      >
        <i class="pi pi-arrow-left"></i>
      </button>
      <div>
        <h1 class="text-2xl font-semibold text-slate-800">Tambah Surat</h1>
        <p class="text-sm text-slate-500 mt-1">
          Input surat manual untuk warga yang mengajukan langsung ke kelurahan.
        </p>
      </div>
    </div>

    <!-- Stepper indicator -->
    <div class="flex items-center gap-2 mb-6 print:hidden" v-if="!submitted">
      <div
        v-for="(label, i) in ['Kategori Surat', 'Jenis Surat', 'Data Pemohon']"
        :key="label"
        class="flex items-center gap-2"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
            :class="step >= i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'"
          >
            {{ i + 1 }}
          </div>
          <span
            class="text-sm font-medium"
            :class="step >= i + 1 ? 'text-slate-800' : 'text-slate-400'"
          >
            {{ label }}
          </span>
        </div>
        <div v-if="i < 2" class="w-8 h-px bg-slate-200 mx-1"></div>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 print:hidden" v-if="!submitted">
      <!-- Step 1: pilih kategori -->
      <div v-if="step === 1">
        <h2 class="text-base font-semibold text-slate-800 mb-1">Pilih Kategori Surat</h2>
        <p class="text-sm text-slate-500 mb-5">
          Pilih kategori sesuai jenis surat yang diajukan warga. Hanya tipe surat berstatus
          <span class="font-medium text-slate-700">Aktif</span> yang tersedia di sini.
        </p>

        <p v-if="categories.length === 0" class="text-sm text-slate-400 py-8 text-center">
          Belum ada tipe surat aktif. Tambahkan dulu lewat
          <router-link to="/letter-type" class="text-blue-600 hover:underline">Pengelolaan Tipe Surat</router-link>.
        </p>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="cat in categories"
            :key="cat.key"
            class="text-left rounded-xl border border-slate-200 p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            @click="pickCategory(cat.key)"
          >
            <p class="font-semibold text-slate-800">{{ cat.label }}</p>
            <p class="text-xs text-blue-600 mt-3">{{ cat.count }} jenis surat aktif</p>
          </button>
        </div>
      </div>

      <!-- Step 2: pilih jenis surat -->
      <div v-else-if="step === 2">
        <h2 class="text-base font-semibold text-slate-800 mb-1">
          Pilih Jenis Surat
          <span class="text-slate-400 font-normal">— {{ selectedCategoryKey }}</span>
        </h2>
        <p class="text-sm text-slate-500 mb-5">Pilih jenis surat spesifik yang diminta warga.</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="type in typesInSelectedCategory"
            :key="type.letter_type_id"
            class="text-left rounded-xl border border-slate-200 px-4 py-3 hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
            @click="pickType(type.letter_type_id)"
          >
            <p class="text-sm font-medium text-slate-700">{{ type.letter_name }}</p>
            <p class="text-xs text-slate-400 mt-1">
              {{ type.number_prefix }} · {{ type.processing_time }} · {{ type.signer_name }}
            </p>
          </button>
        </div>
      </div>

      <!-- Step 3: form data pemohon -->
      <div v-else-if="step === 3" class="max-w-xl">
        <h2 class="text-base font-semibold text-slate-800 mb-1">Data Pemohon</h2>
        <p class="text-sm text-slate-500 mb-4">
          {{ selectedCategoryKey }} — <span class="font-medium text-slate-700">{{ selectedLetterType?.letter_name }}</span>
        </p>

        <!-- Info tipe surat: hanya ditampilkan, tidak diedit di sini -- diatur di Pengelolaan Tipe Surat -->
        <div class="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-slate-400 text-xs">Kode Nomor</p>
            <p class="font-medium text-slate-700">{{ selectedLetterType?.number_prefix }}</p>
          </div>
          <div>
            <p class="text-slate-400 text-xs">Estimasi Proses</p>
            <p class="font-medium text-slate-700">{{ selectedLetterType?.processing_time }}</p>
          </div>
          <div>
            <p class="text-slate-400 text-xs">Penandatangan</p>
            <p class="font-medium text-slate-700">{{ selectedLetterType?.signer_name }}</p>
          </div>
          <div>
            <p class="text-slate-400 text-xs">Metode TTD</p>
            <Tag
              :value="selectedLetterType?.signature_method === 'digital' ? 'Digital' : 'Manual'"
              severity="contrast"
              class="mt-0.5"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <AppInput v-model="form.citizenName" placeholder="Nama sesuai KTP" class="w-full" />
            <p v-if="errors.citizenName" class="text-xs text-red-500 mt-1">{{ errors.citizenName }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">NIK</label>
            <AppInput v-model="form.citizenId" placeholder="16 digit NIK" class="w-full" maxlength="16" />
            <p v-if="errors.citizenId" class="text-xs text-red-500 mt-1">{{ errors.citizenId }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">No. Telepon (opsional)</label>
            <AppInput v-model="form.phone" placeholder="08xxxxxxxxxx" class="w-full" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
            <AppInput v-model="form.address" placeholder="Alamat sesuai domisili" class="w-full" />
            <p v-if="errors.address" class="text-xs text-red-500 mt-1">{{ errors.address }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Catatan (opsional)</label>
            <AppInput
              v-model="form.notes"
              placeholder="Catatan tambahan untuk verifikator"
              class="w-full"
            />
          </div>
        </div>

        <div class="flex items-center gap-3 mt-6">
          <AppButton label="Kembali" variant="outline" @click="step = 2" />
          <AppButton
            :label="isSubmitting ? 'Memproses...' : 'Cetak Surat'"
            variant="primary"
            :disabled="isSubmitting"
            @click="submitForm"
          />
        </div>
      </div>
    </div>

    <!-- ================= Preview surat siap cetak ================= -->
    <div v-if="submitted">
      <!-- Toolbar aksi -- disembunyikan saat print, hanya area surat di bawah yang tercetak -->
      <div class="flex items-center justify-between mb-4 print:hidden">
        <div class="flex items-center gap-2 text-sm text-slate-500">
          <i class="pi pi-check-circle text-green-600"></i>
          Surat tersimpan (Request ID {{ submitted.requestId }}) — status
          <span class="font-medium text-slate-700">Pending</span>, menunggu verifikasi.
        </div>
        <div class="flex items-center gap-3">
          <AppButton label="Tambah Surat Lagi" variant="outline" @click="resetAndAddAnother" />
          <AppButton label="Lihat Daftar Surat" variant="outline" @click="router.push('/letter')" />
          <AppButton label="Cetak Sekarang" icon="pi pi-print" variant="primary" @click="printLetter" />
        </div>
      </div>

      <!-- Area surat: ini yang tercetak (id dipakai oleh CSS @media print di bawah) -->
      <div id="print-area" class="bg-white rounded-2xl border border-slate-200 shadow-sm mx-auto max-w-3xl p-10 print:shadow-none print:border-0 print:rounded-none print:p-0">
        <!-- Kop surat -- placeholder, ganti dengan data Profil Desa begitu tersedia -->
        <div class="flex items-center gap-4 border-b-2 border-slate-800 pb-4 mb-6">
          <div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">
            Logo
          </div>
          <div class="text-center flex-1">
            <p class="font-bold text-lg uppercase tracking-wide">Pemerintah Desa</p>
            <p class="font-bold text-lg uppercase tracking-wide">Kecamatan — Kabupaten</p>
            <p class="text-xs text-slate-500 mt-1">
              Alamat Kantor Desa, Kode Pos — Telp. (0000) 000000
            </p>
          </div>
        </div>

        <div class="text-center mb-6">
          <p class="font-bold underline uppercase">{{ submitted.purpose }}</p>
          <p class="text-sm text-slate-600">Nomor: {{ submitted.letterNumber }}</p>
        </div>

        <div class="text-sm leading-relaxed text-slate-800 space-y-4">
          <p>Yang bertanda tangan di bawah ini menerangkan bahwa:</p>

          <table class="ml-4">
            <tbody>
              <tr>
                <td class="pr-3 py-0.5 align-top">Nama</td>
                <td class="pr-3 py-0.5 align-top">:</td>
                <td class="py-0.5 font-medium">{{ submitted.citizenName }}</td>
              </tr>
              <tr>
                <td class="pr-3 py-0.5 align-top">NIK</td>
                <td class="pr-3 py-0.5 align-top">:</td>
                <td class="py-0.5 font-medium">{{ submitted.citizenId }}</td>
              </tr>
              <tr>
                <td class="pr-3 py-0.5 align-top">Alamat</td>
                <td class="pr-3 py-0.5 align-top">:</td>
                <td class="py-0.5 font-medium">{{ form.address }}</td>
              </tr>
            </tbody>
          </table>

          <p>
            Adalah benar warga kami dan mengajukan permohonan
            <span class="font-medium">{{ submitted.purpose }}</span> untuk keperluan yang
            bersangkutan.
          </p>

          <p v-if="submitted.notes">Catatan: {{ submitted.notes }}</p>

          <p>
            Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan
            sebagaimana mestinya.
          </p>
        </div>

        <div class="flex justify-end mt-10">
          <div class="text-center text-sm">
            <p>Ditetapkan di: ______________</p>
            <p>Pada tanggal: {{ printDate }}</p>
            <p class="mt-16 font-medium">{{ submitted.signerName }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Saat print, sembunyikan seluruh layout admin (sidebar, navbar, dsb via
   AdminLayout.vue yang sudah pakai print:hidden) dan hanya tampilkan
   #print-area, dipaksa ke ukuran halaman penuh tanpa dekorasi kartu. */
@media print {
  body * {
    visibility: hidden;
  }
  #print-area,
  #print-area * {
    visibility: visible;
  }
  #print-area {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
}
</style>