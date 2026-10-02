<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Avatar from 'primevue/avatar'
import Badge from 'primevue/badge'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import OverlayBadge from 'primevue/overlaybadge'
import Popover from 'primevue/popover'
import ScrollPanel from 'primevue/scrollpanel'
import { useToast } from 'primevue/usetoast'
import { useNotificationStore } from '@/stores/notification.store'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useNotificationStore()
const popover = ref()

const typeMeta = {
  letter: { icon: 'pi pi-file', label: 'Pengajuan surat' },
  complaint: { icon: 'pi pi-comments', label: 'Aduan warga' },
}

const badgeText = computed(() => (store.unreadCount > 99 ? '99+' : String(store.unreadCount)))
const bellLabel = computed(() =>
  store.unreadCount > 0
    ? `Notifikasi, ${store.unreadCount} belum dibaca`
    : 'Notifikasi',
)

function relativeTime(iso) {
  if (!iso) return ''
  // lastFetchedAt dibaca supaya teks "x menit lalu" ikut segar setiap polling
  const now = store.lastFetchedAt ?? Date.now()
  const diffSec = Math.round((new Date(iso).getTime() - now) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat('id', { numeric: 'auto' })
  if (abs < 60) return 'Baru saja'
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  return rtf.format(Math.round(diffSec / 86400), 'day')
}

function toggle(event) {
  popover.value.toggle(event)
}

function openItem(item) {
  store.markRead(item.key)
  popover.value.hide()
  router.push(item.to)
}

function announce(arrivals) {
  if (arrivals.length === 1) {
    const [item] = arrivals
    toast.add({
      severity: 'info',
      summary: item.type === 'letter' ? 'Pengajuan surat baru' : 'Aduan baru',
      detail: `${item.title} dari ${item.from}`,
      life: 6000,
    })
    return
  }
  toast.add({
    severity: 'info',
    summary: `${arrivals.length} notifikasi baru`,
    detail: 'Ada pengajuan atau aduan baru dari warga.',
    life: 6000,
  })
}

// Membuka halaman detail pengajuan/aduan = dianggap sudah dibaca.
// Meninggalkan halaman Surat/Aduan = refresh langsung supaya badge ikut turun
// setelah admin memverifikasi/menolak.
watch(
  () => route.fullPath,
  (_, fromPath) => {
    if (route.name === 'complaint-response') store.markRead(`complaint:${route.params.id}`)
    if (route.name === 'letter-verification-detail') store.markRead(`letter:${route.params.id}`)
    if (fromPath && /^\/(letter|complaint)/.test(fromPath)) store.refresh({ force: true })
  },
)

onMounted(() => {
  store.start(announce)
  if (route.name === 'complaint-response') store.markRead(`complaint:${route.params.id}`)
  if (route.name === 'letter-verification-detail') store.markRead(`letter:${route.params.id}`)
})
onBeforeUnmount(() => store.stop())
</script>

<template>
  <div class="shrink-0">
    <OverlayBadge v-if="store.unreadCount > 0" :value="badgeText" severity="danger" size="small">
      <Button
        icon="pi pi-bell"
        text
        rounded
        severity="secondary"
        :aria-label="bellLabel"
        aria-haspopup="true"
        @click="toggle"
      />
    </OverlayBadge>
    <Button
      v-else
      icon="pi pi-bell"
      text
      rounded
      severity="secondary"
      :aria-label="bellLabel"
      aria-haspopup="true"
      @click="toggle"
    />

    <Popover ref="popover" :pt="{ content: { class: '!p-0' } }">
      <div class="w-[360px] max-w-[calc(100vw-2rem)]">
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p class="m-0 text-sm font-semibold text-neutral-900">Notifikasi</p>
            <p class="m-0 text-xs text-neutral-500">
              {{ store.pendingLetterCount }} surat dan {{ store.pendingComplaintCount }} aduan menunggu tindakan
            </p>
          </div>
          <Button
            label="Tandai semua dibaca"
            text
            size="small"
            class="shrink-0"
            :disabled="store.unreadCount === 0"
            @click="store.markAllRead()"
          />
        </div>

        <Divider class="!m-0" />

        <Message
          v-if="store.loadFailed"
          severity="error"
          size="small"
          :closable="false"
          class="!m-3"
        >
          Gagal memperbarui notifikasi. Akan dicoba lagi otomatis.
        </Message>

        <ScrollPanel v-if="store.items.length" style="width: 100%; max-height: 420px">
          <template v-for="(item, index) in store.items" :key="item.key">
            <button
              type="button"
              class="w-full flex items-start gap-3 px-4 py-3 text-left bg-transparent border-0 cursor-pointer hover:bg-neutral-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-600"
              :class="{ 'bg-primary-50/50': !item.read }"
              @click="openItem(item)"
            >
              <Avatar
                :icon="typeMeta[item.type].icon"
                shape="circle"
                :class="item.read ? '!bg-neutral-100 !text-neutral-500' : '!bg-primary-100 !text-primary-700'"
              />
              <span class="min-w-0 flex-1">
                <span class="block text-xs text-neutral-500">{{ typeMeta[item.type].label }}</span>
                <span
                  class="block text-sm text-neutral-900 truncate"
                  :class="item.read ? 'font-medium' : 'font-semibold'"
                >
                  {{ item.title }}
                </span>
                <span class="block text-xs text-neutral-600 truncate">dari {{ item.from }}</span>
                <span class="block text-xs text-neutral-400 mt-0.5">{{ relativeTime(item.time) }}</span>
              </span>
              <Badge
                v-if="!item.read"
                severity="info"
                size="small"
                class="mt-2 shrink-0"
                aria-label="Belum dibaca"
              />
            </button>
            <Divider v-if="index < store.items.length - 1" class="!m-0" />
          </template>
        </ScrollPanel>

        <div v-else class="px-6 py-10 text-center">
          <i class="pi pi-bell text-2xl text-neutral-300" />
          <p class="m-0 mt-3 text-sm font-medium text-neutral-800">Belum ada yang menunggu</p>
          <p class="m-0 mt-1 text-xs text-neutral-500">
            Pengajuan surat dan aduan baru dari warga akan muncul di sini.
          </p>
        </div>
      </div>
    </Popover>
  </div>
</template>