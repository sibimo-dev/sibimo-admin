<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'

import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Editor from 'primevue/editor'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Card from 'primevue/card'

import { getVisionMissions, saveVisionMission } from '@/services/profile.service'

const toast = useToast()
const saving = ref(false)

const isEdit = computed(() => !!form.vision_mission_id)

const pageTitle = computed(() => (isEdit.value ? 'Edit Visi & Misi' : 'Tambah Visi & Misi'))
const mainButtonLabel = computed(() => (isEdit.value ? 'Perbarui' : 'Terbitkan'))

const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Terbit', value: 'Published' },
]

const MIN_MISSIONS = 4

function createMissionItem(text = '') {
  return {
    id: `mission-${crypto.randomUUID()}`,
    text,
  }
}

const form = reactive({
  vision_mission_id: null,
  title: '',
  vision: '',
  status: 'Draft',
  published_at: null,
})

const missions = ref(Array.from({ length: MIN_MISSIONS }, () => createMissionItem()))

const statusOpen = ref(true)
const statusDisplay = computed(() => (
  statusOptions.find((item) => item.value === form.status)?.label ?? form.status
))

function loadExisting(visionMission) {
  if (!visionMission) return
  Object.assign(form, {
    vision_mission_id: visionMission.vision_mission_id,
    title: visionMission.title ?? '',
    vision: visionMission.vision ?? '',
    status: visionMission.status ?? 'Draft',
    published_at: visionMission.published_at ?? null,
  })
  const existingMissions = Array.isArray(visionMission.missions) ? visionMission.missions : []
  missions.value = existingMissions.length
    ? existingMissions.map((text) => createMissionItem(text))
    : Array.from({ length: MIN_MISSIONS }, () => createMissionItem())
}

onMounted(async () => {
  try {
    const visionMissions = await getVisionMissions()
    loadExisting(visionMissions[0])
  } catch (error) {
    toast.add({ severity: 'error', summary: error.response?.data?.message ?? 'Gagal memuat data visi dan misi', life: 3000 })
  }
})

// Kelola daftar Misi
function addMission() {
  missions.value.push(createMissionItem())
}

function removeMission(missionId) {
  if (missions.value.length <= 1) return
  missions.value = missions.value.filter((mission) => mission.id !== missionId)
}
// end kelola Misi

async function persist(nextStatus) {
  if (!form.title.trim()) {
    toast.add({ severity: 'error', summary: 'Judul wajib diisi', life: 2500 })
    return
  }

  if (!form.vision.trim()) {
    toast.add({ severity: 'error', summary: 'Visi wajib diisi', life: 2500 })
    return
  }

  const filledMissions = missions.value.map((mission) => mission.text.trim()).filter(Boolean)
  if (!filledMissions.length) {
    toast.add({ severity: 'error', summary: 'Minimal isi salah satu misi', life: 2500 })
    return
  }

  form.status = nextStatus
  saving.value = true
  try {
    if (form.status === 'Published' && !form.published_at) {
      form.published_at = new Date().toISOString().slice(0, 10)
    }

    const saved = await saveVisionMission({
      id: form.vision_mission_id,
      payload: {
        title: form.title.trim(),
        status: form.status,
        published_at: form.published_at,
        vision: form.vision,
        missions: filledMissions,
      },
    })
    loadExisting(saved)

    toast.add({ severity: 'success', summary: 'Berhasil disimpan', life: 2000 })
  } finally {
    saving.value = false
  }
}

function saveDraft() {
  persist('Draft')
}

function saveMain() {
  persist(isEdit.value ? form.status : 'Published')
}
</script>

<template>
  <div class="min-h-full text-slate-800">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="m-0 text-[22px] font-bold text-slate-900">
        {{ pageTitle }}
      </h1>
    </div>

    <div class="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card>
        <template #content>
          <div class="flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <label for="title" class="text-[13px] font-semibold text-slate-700">
                Judul
              </label>
              <InputText
                id="title"
                v-model="form.title"
                placeholder="Judul"
                fluid
              />
            </div>

            <div class="flex flex-col gap-2">
              <label class="text-[13px] font-semibold text-slate-700">
                Visi
              </label>

              <Editor
                v-model="form.vision"
                editorStyle="height: 160px"
                placeholder="Tulis visi desa di sini"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <span class="text-[13px] font-semibold text-slate-700">
                  Misi
                </span>
                <Button
                  label="Tambah Misi"
                  icon="pi pi-plus"
                  text
                  size="small"
                  @click="addMission"
                />
              </div>

              <div
                v-for="(mission, index) in missions"
                :key="mission.id"
                class="flex items-start gap-2.5"
              >
                <span
                  class="mt-2 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600"
                >
                  {{ index + 1 }}
                </span>

                <Textarea
                  v-model="mission.text"
                  :placeholder="`Tulis misi ke-${index + 1}`"
                  autoResize
                  rows="1"
                  class="flex-1"
                  fluid
                />

                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  aria-label="Hapus misi"
                  :disabled="missions.length <= 1"
                  @click="removeMission(mission.id)"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <aside class="flex flex-col gap-3.5">
        <Card>
          <template #content>
            <div class="flex gap-2.5">
              <Button
                label="Simpan Draft"
                severity="secondary"
                outlined
                class="flex-1"
                :loading="saving"
                @click="saveDraft"
              />

              <Button
                :label="mainButtonLabel"
                class="flex-1"
                :loading="saving"
                @click="saveMain"
              />
            </div>
          </template>
        </Card>

        <Card>
          <template #content>
            <div class="flex flex-col gap-3">
              <button
                type="button"
                class="flex items-center justify-between text-left text-[13px] text-slate-700"
                @click="statusOpen = !statusOpen"
              >
                <span>
                  Status:
                  <strong>{{ statusDisplay }}</strong>
                </span>

                <i
                  class="pi pi-chevron-down text-xs text-slate-400 transition-transform"
                  :class="{ 'rotate-180': statusOpen }"
                />
              </button>

              <Select
                v-show="statusOpen"
                v-model="form.status"
                :options="statusOptions"
                optionLabel="label"
                optionValue="value"
                fluid
              />
            </div>
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>
