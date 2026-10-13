<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Card from 'primevue/card'
import { getFooterSettings, saveFooterSettings } from '@/services/footer.service'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const logoFile = ref(null)
const stampFile = ref(null)
const logoPreview = ref('')
const stampPreview = ref('')

const form = reactive({
  footer_setting_id: null,
  village_name: '',
  description: '',
  address: '',
  phone: '',
  email: '',
  social_media: [],
})

function resetForm(data) {
  if (!data) return
  Object.assign(form, {
    footer_setting_id: data.footer_setting_id ?? null,
    village_name: data.village_name ?? '',
    description: data.description ?? '',
    address: data.address ?? '',
    phone: data.phone ?? '',
    email: data.email ?? '',
    social_media: Array.isArray(data.social_media)
      ? data.social_media.map((item) => ({ platform: item.platform ?? '', url: item.url ?? '' }))
      : [],
  })
  logoPreview.value = data.logo ?? ''
  stampPreview.value = data.stamp ?? ''
}

function addSocialMedia() {
  form.social_media.push({ platform: '', url: '' })
}

function removeSocialMedia(index) {
  form.social_media.splice(index, 1)
}

function selectFile(event, type) {
  const file = event.target.files?.[0] ?? null
  if (!file) return

  if (type === 'logo') {
    logoFile.value = file
    logoPreview.value = URL.createObjectURL(file)
  } else {
    stampFile.value = file
    stampPreview.value = URL.createObjectURL(file)
  }
}

function clearFile(type) {
  if (type === 'logo') {
    logoFile.value = null
    logoPreview.value = ''
  } else {
    stampFile.value = null
    stampPreview.value = ''
  }
}

async function load() {
  loading.value = true
  try {
    resetForm(await getFooterSettings())
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: error.response?.data?.message ?? 'Gagal memuat pengaturan footer',
      life: 3500,
    })
  } finally {
    loading.value = false
  }
}

async function save() {
  if (!form.village_name.trim()) {
    toast.add({ severity: 'error', summary: 'Nama kalurahan wajib diisi', life: 2500 })
    return
  }

  const invalidSocial = form.social_media.some((item) => !item.platform.trim() || !/^https?:\/\//i.test(item.url.trim()))
  if (invalidSocial) {
    toast.add({ severity: 'error', summary: 'Platform dan URL sosial media harus diisi dengan URL http/https', life: 3500 })
    return
  }

  saving.value = true
  try {
    const saved = await saveFooterSettings({
      id: form.footer_setting_id,
      payload: {
        ...form,
        village_name: form.village_name.trim(),
        social_media: form.social_media.map((item) => ({
          platform: item.platform.trim(),
          url: item.url.trim(),
        })),
      },
      logo: logoFile.value,
      stamp: stampFile.value,
    })
    resetForm(saved)
    logoFile.value = null
    stampFile.value = null
    toast.add({ severity: 'success', summary: 'Pengaturan footer berhasil disimpan', life: 2500 })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: error.response?.data?.message ?? 'Pengaturan footer gagal disimpan',
      detail: Object.values(error.response?.data?.errors ?? {}).flat().join(' '),
      life: 4500,
    })
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">Pengaturan Footer</h1>
      <p class="mt-1 text-sm text-slate-500">Kelola informasi yang tampil di bagian bawah website publik.</p>
    </div>

    <div v-if="loading" class="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
      Memuat pengaturan footer...
    </div>

    <div v-else class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700" for="village-name">Nama kalurahan</label>
              <InputText id="village-name" v-model="form.village_name" fluid />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700" for="description">Deskripsi</label>
              <Textarea id="description" v-model="form.description" rows="3" autoResize fluid />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700" for="address">Alamat</label>
              <Textarea id="address" v-model="form.address" rows="3" autoResize fluid />
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-slate-700" for="phone">Telepon</label>
                <InputText id="phone" v-model="form.phone" fluid />
              </div>
              <div class="flex flex-col gap-2">
                <label class="text-[13px] font-semibold text-slate-700" for="email">Email</label>
                <InputText id="email" v-model="form.email" type="email" fluid />
              </div>
            </div>

            <div class="border-t border-slate-200 pt-5">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 class="text-sm font-bold text-slate-800">Social media</h2>
                  <p class="text-xs text-slate-500">Gunakan URL lengkap dengan http:// atau https://.</p>
                </div>
                <Button label="Tambah" icon="pi pi-plus" size="small" text @click="addSocialMedia" />
              </div>

              <div v-if="!form.social_media.length" class="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                Belum ada social media.
              </div>
              <div v-for="(item, index) in form.social_media" :key="index" class="mb-3 flex items-start gap-2">
                <InputText v-model="item.platform" placeholder="Platform" class="w-32" />
                <InputText v-model="item.url" placeholder="https://..." class="min-w-0 flex-1" />
                <Button icon="pi pi-trash" severity="danger" text rounded aria-label="Hapus social media" @click="removeSocialMedia(index)" />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-4">
        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <Button label="Simpan Pengaturan" icon="pi pi-save" :loading="saving" @click="save" />
              <p class="text-xs leading-5 text-slate-500">Logo dan stempel akan disimpan sebagai media footer dan dapat diganti kapan saja.</p>
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <h2 class="text-sm font-bold text-slate-800">Logo</h2>
              <img v-if="logoPreview" :src="logoPreview" alt="Pratinjau logo" class="mx-auto h-24 max-w-full object-contain" />
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="selectFile($event, 'logo')" />
              <Button v-if="logoPreview" label="Hapus pilihan" severity="secondary" text size="small" @click="clearFile('logo')" />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <h2 class="text-sm font-bold text-slate-800">Stempel</h2>
              <img v-if="stampPreview" :src="stampPreview" alt="Pratinjau stempel" class="mx-auto h-24 max-w-full object-contain" />
              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="selectFile($event, 'stamp')" />
              <Button v-if="stampPreview" label="Hapus pilihan" severity="secondary" text size="small" @click="clearFile('stamp')" />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>
