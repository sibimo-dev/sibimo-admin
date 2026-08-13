<script setup>
/**
 * Halaman Form Tipe Surat (Tambah/Edit).
 * Dipakai untuk 2 mode: tambah baru (form kosong) dan edit
 * (form terisi data existing, ambil dari route param :id).
 * Ganti dummyData dengan panggilan ke tipeSurat.service.js begitu backend siap.
 */
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const tipeSuratId = computed(() => route.params.id || null)
const isEditMode = computed(() => !!tipeSuratId.value)

// --- Informasi Dasar ---
const form = reactive({
  kodeTipeSurat: '',
  prefixPenomoran: '',
  namaLayanan: '',
  kategoriLayanan: null,
  estimasiProses: '',
  metodeTandaTangan: null,
  deskripsi: '',
  aktif: true,
})

const kategoriOptions = [
  { label: 'Surat Keterangan', value: 'keterangan' },
  { label: 'Surat Permohonan', value: 'permohonan' },
  { label: 'Surat Pengantar', value: 'pengantar' },
]

const metodeTandaTanganOptions = [
  { label: 'Tanda Tangan Digital (TTE)', value: 'digital' },
  { label: 'Tanda Tangan Manual', value: 'manual' },
]

const deskripsiMaxLength = 255

// --- Penandatangan ---
const pejabatPenandatangan = ref(null)
const pejabatOptions = [
  { label: 'Ahmad Hidayat - Kepala Desa', value: 'kepala-desa' },
  { label: 'Siti Aminah - Kasi Pemerintahan', value: 'kasi-pemerintahan' },
  { label: 'Budi Prakoso - Sekretaris Desa', value: 'sekretaris-desa' },
]

// --- Persyaratan Dokumen ---
const persyaratanDokumen = ref([
  { id: 1, nama: 'Kartu Tanda Penduduk (KTP)', deskripsi: 'Fotokopi KTP pemohon', wajib: true },
  { id: 2, nama: 'Kartu Keluarga (KK)', deskripsi: 'Fotokopi KK pemohon', wajib: true },
  { id: 3, nama: 'Foto Tempat Usaha', deskripsi: 'Minimal 2 foto dari sisi berbeda', wajib: false },
])

function tambahDokumen() {
  persyaratanDokumen.value.push({
    id: Date.now(),
    nama: '',
    deskripsi: '',
    wajib: false,
  })
}

function hapusDokumen(id) {
  persyaratanDokumen.value = persyaratanDokumen.value.filter((d) => d.id !== id)
}

// --- Info terakhir diubah (hanya tampil di mode edit) ---
const terakhirDiubah = ref({
  tanggal: '24 Okt 2023, 14:30 WIB',
  oleh: 'Admin SIBIMO',
})

// --- Load data existing kalau mode edit ---
onMounted(() => {
  if (isEditMode.value) {
    // TODO: ganti dengan panggilan ke tipeSurat.service.js -> getById(tipeSuratId.value)
    // Contoh dummy prefill:
    form.kodeTipeSurat = 'SKU-01'
    form.prefixPenomoran = '400/SKU/'
    form.namaLayanan = 'Surat Keterangan Usaha'
    form.kategoriLayanan = 'keterangan'
    form.estimasiProses = '15 menit'
    form.metodeTandaTangan = 'digital'
    form.deskripsi = 'Surat keterangan yang menerangkan bahwa pemohon memiliki usaha aktif.'
    form.aktif = true
    pejabatPenandatangan.value = 'kepala-desa'
  }
})

// --- Simpan / Batal ---
const saving = ref(false)

async function handleSimpan() {
  saving.value = true
  try {
    const payload = {
      ...form,
      pejabatPenandatangan: pejabatPenandatangan.value,
      persyaratanDokumen: persyaratanDokumen.value,
    }
    // TODO: ganti dengan panggilan ke tipeSurat.service.js
    // isEditMode.value ? updateTipeSurat(tipeSuratId.value, payload) : createTipeSurat(payload)
    console.log('Simpan tipe surat', payload)

    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
    router.push({ name: 'tipe-surat-list' })
  } finally {
    saving.value = false
  }
}

function handleBatal() {
  router.push({ name: 'tipe-surat-list' })
}
</script>

<template>
  <div>
    <div class="mb-4">
      <h1 class="page-title mb-1">Kelola Tipe Surat</h1>
      <p class="page-subtitle mb-0">
        Tambahkan atau edit konfigurasi tipe layanan surat. Pastikan kode unik dan template
        view sesuai.
      </p>
    </div>

    <!-- Informasi Dasar & Penandatangan: full width -->
    <div class="flex flex-col gap-4 mb-4">
      <!-- Informasi Dasar -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="section-title mb-0">Informasi Dasar</h2>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-neutral-500">STATUS:</span>
            <ToggleSwitch v-model="form.aktif" />
            <span class="text-xs font-medium text-neutral-700">
              {{ form.aktif ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.kodeTipeSurat"
              label="Kode Tipe Surat"
              placeholder="e.g., SKU-01"
              required
            />
            <AppInput
              v-model="form.prefixPenomoran"
              label="Prefix Penomoran"
              placeholder="e.g., 400/SKU/"
              required
            />

            <div class="col-span-2">
              <AppInput
                v-model="form.namaLayanan"
                label="Nama Layanan Surat"
                placeholder="e.g., Surat Keterangan Usaha"
                required
              />
            </div>

            <div>
              <label class="field-label mb-1 block">
                Kategori Layanan <span class="text-danger-500">*</span>
              </label>
              <Select
                v-model="form.kategoriLayanan"
                :options="kategoriOptions"
                option-label="label"
                option-value="value"
                placeholder="Pilih Kategori"
                class="w-full"
              />
            </div>

            <AppInput
              v-model="form.estimasiProses"
              label="Estimasi Proses"
              placeholder="e.g., 15 menit"
            />

            <div class="col-span-2">
              <label class="field-label mb-1 block">
                Metode Tanda Tangan <span class="text-danger-500">*</span>
              </label>
              <Select
                v-model="form.metodeTandaTangan"
                :options="metodeTandaTanganOptions"
                option-label="label"
                option-value="value"
                placeholder="Pilih Metode"
                class="w-full"
              />
            </div>

            <div class="col-span-2">
              <div class="flex items-center justify-between mb-1">
                <label class="field-label">Deskripsi</label>
                <span class="text-xs text-neutral-400">
                  {{ form.deskripsi.length }}/{{ deskripsiMaxLength }}
                </span>
              </div>
              <textarea
                v-model="form.deskripsi"
                :maxlength="deskripsiMaxLength"
                rows="3"
                class="app-textarea"
                placeholder="Jelaskan kegunaan dan informasi singkat mengenai layanan surat ini..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Penandatangan -->
        <div class="card p-4">
          <h2 class="section-title mb-3">Penandatangan</h2>
          <label class="field-label mb-1 block">
            Pilih Pejabat Penandatangan <span class="text-danger-500">*</span>
          </label>
          <Select
            v-model="pejabatPenandatangan"
            :options="pejabatOptions"
            option-label="label"
            option-value="value"
            placeholder="Pilih Pejabat"
            class="w-full"
          />
        </div>
    </div>

    <!-- Baris terakhir: Persyaratan Dokumen (kiri, lebar) + Terakhir Diubah (kanan, sempit) -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Persyaratan Dokumen -->
      <div class="lg:col-span-2">
        <div class="card p-4">
          <div class="flex items-center justify-between mb-3">
            <h2 class="section-title mb-0">
              <i class="pi pi-folder"></i>
              Persyaratan Dokumen
            </h2>
            <AppButton
              label="Tambah Dokumen"
              icon="pi pi-plus"
              variant="outline"
              size="small"
              @click="tambahDokumen"
            />
          </div>

          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-neutral-500 border-b border-neutral-100">
                <th class="py-2 font-medium">Nama Dokumen</th>
                <th class="py-2 font-medium">Deskripsi Singkat</th>
                <th class="py-2 font-medium text-center">Wajib</th>
                <th class="py-2 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="doc in persyaratanDokumen"
                :key="doc.id"
                class="border-b border-neutral-50"
              >
                <td class="py-2 pr-2">
                  <input
                    v-model="doc.nama"
                    type="text"
                    class="app-table-input"
                    placeholder="Nama dokumen"
                  />
                </td>
                <td class="py-2 pr-2">
                  <input
                    v-model="doc.deskripsi"
                    type="text"
                    class="app-table-input"
                    placeholder="Deskripsi singkat"
                  />
                </td>
                <td class="py-2 text-center">
                  <Checkbox v-model="doc.wajib" :binary="true" />
                </td>
                <td class="py-2 text-center">
                  <button
                    class="text-neutral-400 hover:text-danger-500"
                    @click="hapusDokumen(doc.id)"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </td>
              </tr>
              <tr v-if="persyaratanDokumen.length === 0">
                <td colspan="4" class="py-4 text-center text-neutral-400 text-sm">
                  Belum ada persyaratan dokumen. Klik "Tambah Dokumen" untuk menambahkan.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Kolom kanan: info & tindakan -->
      <div class="flex flex-col gap-4">
        <div class="card p-4">
          <div class="history-box mb-4">
            <div class="history-icon">
              <i class="pi pi-history"></i>
            </div>
            <div>
              <p class="field-label mb-1">Terakhir Diubah</p>
              <template v-if="isEditMode">
                <p class="text-sm text-neutral-700">{{ terakhirDiubah.tanggal }}</p>
                <p class="text-xs text-neutral-500">Oleh: {{ terakhirDiubah.oleh }}</p>
              </template>
              <p v-else class="text-sm text-neutral-500">Belum pernah disimpan</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <AppButton
              label="Batal"
              variant="outline"
              class="flex-1"
              @click="handleBatal"
            />
            <AppButton
              :label="isEditMode ? 'Simpan Perubahan' : 'Simpan'"
              icon="pi pi-save"
              variant="dark"
              class="flex-1"
              :loading="saving"
              @click="handleSimpan"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-neutral-800, #1f2937);
  font-size: 0.95rem;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-neutral-600, #4b5563);
}

.app-textarea {
  width: 100%;
  border: 1px solid var(--color-neutral-300, #d1d5db);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 0.875rem;
  resize: vertical;
  outline: none;
}

.app-textarea:focus {
  border-color: var(--color-primary-500, #2f6690);
}

.app-table-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 0.875rem;
  outline: none;
  background: var(--color-neutral-50, #f9fafb);
}

.app-table-input:focus {
  border-color: var(--color-primary-500, #2f6690);
  background: white;
}

.history-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-info-50, #eff6ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-500, #2f6690);
  flex-shrink: 0;
  font-size: 1rem;
}
</style>