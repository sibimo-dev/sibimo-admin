<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { getRegionAreas, updateRw, updateRt } from '@/services/region.service'

const props = defineProps({ regionId: { type: Number, default: null } })
const visible = defineModel('visible', { type: Boolean, default: false })

const toast = useToast()
const region = ref(null)
const loading = ref(false)
const error = ref('')
const savingKey = ref(null)

/* ---------- Opsi isian (sama dengan form Tambah Staff di Struktur Organisasi) ---------- */
const GENDER_OPTIONS = ['LAKI-LAKI', 'PEREMPUAN']
const EDUCATION_OPTIONS = [
  'SD/Sederajat',
  'SLTP/Sederajat',
  'SLTA/Sederajat',
  'D-I/Sederajat',
  'D-II/Sederajat',
  'D-III/Sederajat',
  'D-IV/S-1/Sederajat',
  'S-2/Sederajat',
  'S-3/Sederajat',
]

function isHigherEducation(level) {
  return /^[DS]-/i.test(String(level ?? '').trim())
}

/* ---------- Muat data ---------- */
// _saved menyimpan nilai terakhir yang tersimpan, supaya tidak menyimpan ulang bila tidak berubah
function withSnapshot(item) {
  const h = item.head ?? {}
  Object.assign(item, {
    gender: h.gender ?? null,
    birth_date: h.birth_date ?? '',
    education: h.education ?? null,
    major: h.major ?? '',
    school_name: h.school_name ?? '',
    graduation_year: h.graduation_year ?? null,
    sk_number: h.sk_number ?? '',
    start_date: h.start_date ?? '',
    end_date: h.term_end_date ?? '',
    position_history: h.position_history ?? [],
  })
  item._saved = { head_name: item.head_name ?? '', head_phone: item.head_phone ?? '' }
  return item
}

async function load() {
  loading.value = true
  error.value = ''
  region.value = null // supaya judul/daftar dusun sebelumnya tidak muncul sesaat
  try {
    const tree = await getRegionAreas()
    const found = tree.find((r) => r.region_id === props.regionId) ?? null
    if (found) {
      found.rws.forEach((rw) => {
        withSnapshot(rw)
        rw.rts.forEach(withSnapshot)
      })
    }
    region.value = found
  } catch {
    error.value = 'Data RW dan RT gagal dimuat.'
  } finally {
    loading.value = false
  }
}

/* ---------- Simpan otomatis nama + No. HP ---------- */
async function save(kind, item) {
  const name = (item.head_name ?? '').trim()
  const phone = (item.head_phone ?? '').trim()
  if (name === item._saved.head_name && phone === item._saved.head_phone) return

  if (!name && phone) {
    error.value = 'Isi nama ketua dulu sebelum mengisi nomor HP.'
    return
  }

  const key = `${kind}-${item.id}`
  savingKey.value = key
  error.value = ''
  try {
    const fn = kind === 'rw' ? updateRw : updateRt
    await fn(item.id, { head_name: name || null, head_phone: phone || null })
    item.head_name = name
    item.head_phone = phone
    item._saved = { head_name: name, head_phone: phone }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Gagal menyimpan.'
  } finally {
    savingKey.value = null
  }
}

/* ---------- Dialog Detail ketua ---------- */
const detailVisible = ref(false)
const detailKind = ref('rw')
const detailTarget = ref(null)
const savingDetail = ref(false)

const emptyDetail = () => ({
  gender: null,
  birth_date: '',
  education: null,
  major: '',
  school_name: '',
  graduation_year: null,
  sk_number: '',
  start_date: '',
  end_date: '',
  position_history: [],
})
const detailForm = reactive(emptyDetail())

const detailTitle = computed(() => {
  const t = detailTarget.value
  if (!t) return 'Detail Ketua'
  return detailKind.value === 'rw' ? `Detail Ketua RW ${t.rw}` : `Detail Ketua RT ${t.rt}`
})

const schoolNameLabel = computed(() => (
  isHigherEducation(detailForm.education) ? 'Nama Instansi Pendidikan' : 'Nama Sekolah'
))
const schoolNamePlaceholder = computed(() => (
  isHigherEducation(detailForm.education) ? 'mis. Universitas Negeri Yogyakarta' : 'mis. SMA Negeri 1 Yogyakarta'
))

// Tanda di tombol: sudah ada detail yang tersimpan atau belum.
function hasDetail(item) {
  return !!(
    item.gender || item.birth_date || item.education || item.major || item.school_name ||
    item.graduation_year || item.sk_number || item.start_date || item.end_date ||
    (Array.isArray(item.position_history) && item.position_history.length)
  )
}

function openDetail(kind, item) {
  if (!(item.head_name ?? '').trim()) {
    error.value = 'Isi nama ketua dulu sebelum mengisi detail.'
    return
  }
  error.value = ''
  detailKind.value = kind
  detailTarget.value = item
  Object.assign(detailForm, emptyDetail(), {
    gender: item.gender ?? null,
    birth_date: item.birth_date ?? '',
    education: item.education ?? null,
    major: item.major ?? '',
    school_name: item.school_name ?? '',
    graduation_year: item.graduation_year ?? null,
    sk_number: item.sk_number ?? '',
    start_date: item.start_date ?? '',
    end_date: item.end_date ?? '',
    position_history: (Array.isArray(item.position_history) ? item.position_history : []).map((h) => ({
      sk: h?.sk ?? '',
      date: h?.date ?? '',
      official: h?.official ?? '',
    })),
  })
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  detailTarget.value = null
  Object.assign(detailForm, emptyDetail())
}

function addHistoryRow() {
  detailForm.position_history.push({ sk: '', date: '', official: '' })
}

function removeHistoryRow(index) {
  detailForm.position_history.splice(index, 1)
}

async function saveDetail() {
  const item = detailTarget.value
  if (!item) return

  if (detailForm.end_date && !detailForm.start_date) {
    toast.add({ severity: 'error', summary: 'Tanggal mulai wajib diisi jika tanggal selesai diisi', life: 2500 })
    return
  }
  if (detailForm.start_date && detailForm.end_date && detailForm.end_date < detailForm.start_date) {
    toast.add({ severity: 'error', summary: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai', life: 2500 })
    return
  }

  const payload = {
    head_name: (item.head_name ?? '').trim() || null,
    head_phone: (item.head_phone ?? '').trim() || null,
    gender: detailForm.gender,
    birth_date: detailForm.birth_date || null,
    education: detailForm.education,
    major: detailForm.major.trim(),
    school_name: detailForm.school_name.trim(),
    graduation_year: detailForm.graduation_year,
    sk_number: detailForm.sk_number.trim(),
    start_date: detailForm.start_date || null,
    end_date: detailForm.end_date || null,
    // Baris riwayat yang benar-benar kosong tidak ikut disimpan.
    position_history: detailForm.position_history
      .map((h) => ({ sk: h.sk.trim(), date: h.date, official: h.official.trim() }))
      .filter((h) => h.sk || h.date || h.official),
  }

  savingDetail.value = true
  try {
    const fn = detailKind.value === 'rw' ? updateRw : updateRt
    await fn(item.id, payload)
    Object.assign(item, payload)
    item._saved = { head_name: item.head_name ?? '', head_phone: item.head_phone ?? '' }
    toast.add({ severity: 'success', summary: 'Detail ketua disimpan', life: 2000 })
    closeDetail()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: e?.response?.data?.message || 'Gagal menyimpan detail',
      life: 3000,
    })
  } finally {
    savingDetail.value = false
  }
}

watch(visible, (open) => { if (open && props.regionId) load() })
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="region ? `Kelola RW dan RT: ${region.dusun}` : 'Kelola RW dan RT'"
    :style="{ width: '46rem' }"
    :breakpoints="{ '768px': '95vw' }"
  >
    <Message v-if="error" severity="error" :closable="false" class="mb-3 text-[13px]">{{ error }}</Message>

    <div v-if="loading" class="py-8 text-center text-sm text-neutral-500">
      <i class="pi pi-spin pi-spinner" /> Memuat...
    </div>

    <p v-else-if="!region || !region.rws.length" class="py-6 text-center text-sm text-neutral-400">
      Belum ada RW pada dusun ini.
    </p>

    <div v-else class="flex max-h-[65vh] flex-col gap-5 overflow-y-auto pr-1">
      <section v-for="rw in region.rws" :key="rw.id" class="rounded-lg border border-neutral-200 p-3">
        <div class="grid grid-cols-1 items-center gap-2 sm:grid-cols-[4rem_1fr_11rem_2.5rem]">
          <strong class="text-[13px] text-neutral-800">RW {{ rw.rw }}</strong>
          <div class="relative">
            <InputText v-model="rw.head_name" placeholder="Nama Ketua RW" class="w-full" @blur="save('rw', rw)" />
            <i v-if="savingKey === `rw-${rw.id}`" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400" />
          </div>
          <InputText v-model="rw.head_phone" placeholder="No. HP (opsional)" inputmode="tel" class="w-full" @blur="save('rw', rw)" />
          <Button
            icon="pi pi-id-card"
            text
            rounded
            :severity="hasDetail(rw) ? 'primary' : 'secondary'"
            :aria-label="`Detail Ketua RW ${rw.rw}`"
            :title="hasDetail(rw) ? 'Detail sudah diisi' : 'Isi detail ketua'"
            @click="openDetail('rw', rw)"
          />
        </div>

        <div class="mt-3 flex flex-col gap-2 border-l-2 border-neutral-100 pl-3">
          <div
            v-for="rt in rw.rts"
            :key="rt.id"
            class="grid grid-cols-1 items-center gap-2 sm:grid-cols-[4rem_1fr_11rem_2.5rem]"
          >
            <span class="text-[13px] text-neutral-600">RT {{ rt.rt }}</span>
            <div class="relative">
              <InputText v-model="rt.head_name" placeholder="Nama Ketua RT" class="w-full" @blur="save('rt', rt)" />
              <i v-if="savingKey === `rt-${rt.id}`" class="pi pi-spin pi-spinner absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400" />
            </div>
            <InputText v-model="rt.head_phone" placeholder="No. HP (opsional)" inputmode="tel" class="w-full" @blur="save('rt', rt)" />
            <Button
              icon="pi pi-id-card"
              text
              rounded
              :severity="hasDetail(rt) ? 'primary' : 'secondary'"
              :aria-label="`Detail Ketua RT ${rt.rt}`"
              :title="hasDetail(rt) ? 'Detail sudah diisi' : 'Isi detail ketua'"
              @click="openDetail('rt', rt)"
            />
          </div>
        </div>
      </section>
    </div>

    <p class="m-0 mt-3 text-xs text-neutral-500">
      Nama dan No. HP tersimpan otomatis saat kolom ditinggalkan. Klik ikon kartu untuk mengisi detail ketua.
    </p>
  </Dialog>

  <!-- Dialog Detail ketua RW / RT -->
  <Dialog
    v-model:visible="detailVisible"
    modal
    :header="detailTitle"
    :style="{ width: '640px' }"
    :breakpoints="{ '700px': '95vw' }"
    @hide="closeDetail"
  >
    <div v-if="detailTarget" class="flex flex-col gap-5">
      <p class="m-0 text-sm text-slate-500">
        Nama: <strong class="text-slate-800">{{ detailTarget.head_name }}</strong>
      </p>

      <!-- Masa jabatan -->
      <section class="flex flex-col gap-3">
        <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Masa Jabatan</h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1">
            <small class="text-xs text-slate-500">Tanggal mulai</small>
            <InputText v-model="detailForm.start_date" type="date" fluid />
          </div>
          <div class="flex flex-col gap-1">
            <small class="text-xs text-slate-500">Tanggal selesai</small>
            <InputText v-model="detailForm.end_date" type="date" :min="detailForm.start_date || undefined" fluid />
          </div>
        </div>
        <small class="text-xs text-slate-400">Kosongkan tanggal selesai jika masih menjabat (tampil "Sekarang").</small>
      </section>

      <!-- SK -->
      <section class="flex flex-col gap-3">
        <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Surat Keputusan (SK)</h3>
        <div class="flex flex-col gap-1.5">
          <label class="text-[13px] font-semibold text-slate-700">Nomor SK</label>
          <InputText v-model="detailForm.sk_number" placeholder="mis. 1/Kep.Lurah/2022" fluid />
        </div>
      </section>

      <!-- Data pribadi & pendidikan -->
      <section class="flex flex-col gap-3">
        <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Data Pribadi &amp; Pendidikan</h3>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Jenis Kelamin</label>
            <Select v-model="detailForm.gender" :options="GENDER_OPTIONS" placeholder="Pilih jenis kelamin" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Tanggal Lahir</label>
            <InputText v-model="detailForm.birth_date" type="date" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Jenjang Pendidikan</label>
            <Select
              v-model="detailForm.education"
              :options="EDUCATION_OPTIONS"
              editable
              placeholder="Pilih atau ketik jenjang pendidikan"
              fluid
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Jurusan</label>
            <InputText v-model="detailForm.major" placeholder="mis. Manajemen" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">{{ schoolNameLabel }}</label>
            <InputText v-model="detailForm.school_name" :placeholder="schoolNamePlaceholder" fluid />
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-semibold text-slate-700">Tahun Lulus</label>
            <InputNumber v-model="detailForm.graduation_year" :useGrouping="false" :min="1900" :max="2100" placeholder="mis. 2019" fluid />
          </div>
        </div>
      </section>

      <!-- Riwayat jabatan -->
      <section class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="m-0 text-xs font-bold uppercase tracking-wider text-blue-700">Riwayat Jabatan</h3>
          <Button label="Tambah Riwayat" icon="pi pi-plus" size="small" text @click="addHistoryRow" />
        </div>

        <div
          v-if="!detailForm.position_history.length"
          class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-400"
        >
          Belum ada riwayat jabatan.
        </div>

        <div
          v-for="(item, index) in detailForm.position_history"
          :key="index"
          class="rounded-lg border border-slate-200 bg-slate-50/60 p-3"
        >
          <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">Judul / Nomor SK</label>
              <InputText v-model="item.sk" placeholder="mis. 1/Kep.Lurah/2022" size="small" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">Tanggal SK</label>
              <InputText v-model="item.date" type="date" size="small" fluid />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold text-slate-600">Pejabat Penerbit</label>
              <InputText v-model="item.official" placeholder="mis. Lurah" size="small" fluid />
            </div>
          </div>
          <div class="mt-2 flex justify-end">
            <Button label="Hapus Riwayat" icon="pi pi-trash" size="small" text severity="danger" @click="removeHistoryRow(index)" />
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <Button label="Cancel" icon="pi pi-times" text severity="secondary" :disabled="savingDetail" @click="closeDetail" />
      <Button label="Save" icon="pi pi-check" :loading="savingDetail" @click="saveDetail" />
    </template>
  </Dialog>
</template>