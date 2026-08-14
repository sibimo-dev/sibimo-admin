<script setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Divider from 'primevue/divider'

// ====== Data dummy (nanti diganti fetch dari API) ======
const suratId = ref('SKU-20231024-001')
const status = ref('menunggu_otorisasi') // menunggu_otorisasi | selesai | ditolak

const statusMeta = {
  menunggu_otorisasi: { label: 'Menunggu Otorisasi', severity: 'warn' },
  selesai: { label: 'Selesai', severity: 'success' },
  ditolak: { label: 'Ditolak', severity: 'danger' },
}

const verifikasi = ref({
  diverifikasiOleh: 'Siti Aminah',
  jabatan: 'Kasi Pemerintahan',
  waktu: '24 Okt 2023, 10:30 WIB',
  catatan: 'Dokumen lengkap dan sesuai. Lokasi usaha sudah ditinjau.',
})

const otorisasi = ref({
  otorisatorOleh: 'Ahmad Hidayat',
  jabatan: 'Kepala Desa',
  tipeTandaTangan: 'Tanda Tangan Digital (TTE)',
})

const dokumen = ref({
  nomor: '581/015/Desa-XI/2023',
  nama: 'Budi Santoso',
  nik: '3201010101010001',
  alamat: 'Jl. Merdeka No. 45, RT 02/RW 03',
  namaUsaha: 'Warung Sembako Makmur',
  bidang: 'Perdagangan',
  tempatTanggal: 'Desa Harapan Makmur, 24 Oktober 2023',
})

// ====== Ubah status ======
const selectedStatus = ref(status.value)
const statusOptions = [
  { value: 'menunggu_otorisasi', label: 'Menunggu Otorisasi' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
]

const isSaving = ref(false)
async function simpanPerubahan() {
  isSaving.value = true
  try {
    // TODO: panggil API update status di sini
    // await api.put(`/surat/${suratId.value}/status`, { status: selectedStatus.value })
    await new Promise((r) => setTimeout(r, 600))
    status.value = selectedStatus.value
  } finally {
    isSaving.value = false
  }
}

function kirimNotifikasi() {
  // TODO: panggil API kirim notifikasi
  alert('Notifikasi berhasil dikirim ke pemohon.')
}

// ====== Unduh draft (print area dokumen -> Save as PDF) ======
function unduhDraft() {
  window.print()
}
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-5 print:hidden">
      <h1 class="text-xl font-bold text-gray-800 m-0">ID: {{ suratId }}</h1>
      <Tag :value="statusMeta[status].label" :severity="statusMeta[status].severity" rounded />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
      <!-- ==================== KOLOM KIRI ==================== -->
      <div class="flex flex-col gap-5 print:hidden">
        <!-- Hasil Verifikasi -->
        <Card>
          <template #title>
            <span class="flex items-center gap-2 text-base font-semibold">
              <i class="pi pi-check-circle text-green-500"></i> Hasil Verifikasi
            </span>
          </template>
          <template #content>
            <div class="mb-4">
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Diverifikasi Oleh
              </div>
              <div class="text-sm font-semibold text-gray-800">
                {{ verifikasi.diverifikasiOleh }}
              </div>
              <div class="text-sm text-gray-500">{{ verifikasi.jabatan }}</div>
            </div>

            <div class="mb-4">
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Waktu Verifikasi
              </div>
              <div class="text-sm text-gray-800">{{ verifikasi.waktu }}</div>
            </div>

            <div>
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Catatan Verifikator
              </div>
              <div class="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600">
                {{ verifikasi.catatan }}
              </div>
            </div>
          </template>
        </Card>

        <!-- Detail Otorisasi -->
        <Card class="bg-gray-800 text-gray-50 [&_.p-card-body]:text-gray-50">
          <template #title>
            <span class="flex items-center gap-2 text-base font-semibold text-gray-50">
              <i class="pi pi-key text-gray-300"></i> Detail Otorisasi
            </span>
          </template>
          <template #content>
            <div class="mb-4">
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Otorisator (Authorized By)
              </div>
              <div class="text-sm font-semibold">{{ otorisasi.otorisatorOleh }}</div>
              <div class="text-sm text-gray-400">{{ otorisasi.jabatan }}</div>
            </div>

            <div>
              <div class="text-[11px] uppercase tracking-wide text-gray-400 mb-1">
                Tipe Tanda Tangan
              </div>
              <div class="text-sm flex items-center gap-1.5">
                <i class="pi pi-verified text-green-400"></i>
                {{ otorisasi.tipeTandaTangan }}
              </div>
            </div>
          </template>
        </Card>

        <!-- Status & Tindakan -->
        <Card>
          <template #title>
            <span class="text-base font-semibold">Status &amp; Tindakan</span>
          </template>
          <template #content>
            <label for="statusSelect" class="block text-[11px] uppercase tracking-wide text-gray-400 mb-1">
              Ubah Status
            </label>
            <Select
              id="statusSelect"
              v-model="selectedStatus"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              class="w-full mb-4"
            />

            <Button
              label="Simpan Perubahan"
              class="w-full mb-2.5"
              severity="contrast"
              :loading="isSaving"
              @click="simpanPerubahan"
            />

            <Button
              label="Kirim Notifikasi"
              icon="pi pi-send"
              class="w-full"
              severity="secondary"
              outlined
              @click="kirimNotifikasi"
            />
          </template>
        </Card>
      </div>

      <!-- ==================== KOLOM KANAN ==================== -->
      <div class="print:col-span-full">
        <Card class="print:shadow-none print:border-none">
          <template #title>
            <div class="flex items-center justify-between print:hidden">
              <span class="flex items-center gap-2 text-base font-semibold">
                <i class="pi pi-file text-gray-500"></i> Pratinjau Dokumen
              </span>
              <Button
                label="Unduh Draft"
                icon="pi pi-download"
                text
                size="small"
                severity="secondary"
                @click="unduhDraft"
              />
            </div>
          </template>
          <template #content>
            <div class="bg-white border border-gray-200 rounded-lg px-10 py-10 text-[13.5px] leading-relaxed text-gray-800 print:border-none print:px-4">
              <div class="text-center text-2xl mb-2">
                <i class="pi pi-shield text-gray-400"></i>
              </div>

              <h3 class="text-center text-lg font-bold tracking-wide m-0 mb-1">
                SURAT KETERANGAN USAHA
              </h3>
              <p class="text-center text-xs text-gray-500 mb-6">
                Nomor: {{ dokumen.nomor }}
              </p>

              <p class="my-4">
                Yang bertanda tangan di bawah ini Kepala Desa, dengan ini menerangkan bahwa:
              </p>

              <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                <span class="text-gray-700">Nama</span>
                <span>:</span>
                <span class="font-semibold">{{ dokumen.nama }}</span>
              </div>
              <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                <span class="text-gray-700">NIK</span>
                <span>:</span>
                <span>{{ dokumen.nik }}</span>
              </div>
              <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                <span class="text-gray-700">Alamat</span>
                <span>:</span>
                <span>{{ dokumen.alamat }}</span>
              </div>

              <p class="my-4">
                Adalah benar penduduk yang berdomisili di alamat tersebut di atas dan saat ini
                memiliki usaha:
              </p>

              <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                <span class="text-gray-700">Nama Usaha</span>
                <span>:</span>
                <span class="font-semibold">{{ dokumen.namaUsaha }}</span>
              </div>
              <div class="grid grid-cols-[110px_12px_1fr] mb-1">
                <span class="text-gray-700">Bidang</span>
                <span>:</span>
                <span>{{ dokumen.bidang }}</span>
              </div>

              <p class="my-4">
                Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.
              </p>

              <div class="mt-8 text-right">
                <p class="m-0">{{ dokumen.tempatTanggal }}</p>
                <p class="m-0">Kepala Desa</p>

                <div class="ml-auto mt-3 mb-3 w-[200px] h-[90px] border border-dashed border-indigo-300 bg-indigo-50 rounded-lg flex items-center justify-center text-center text-[11px] text-indigo-500 print:border-solid">
                  Area Tanda Tangan Digital
                </div>

                <p class="font-bold underline m-0">{{ otorisasi.otorisatorOleh }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>