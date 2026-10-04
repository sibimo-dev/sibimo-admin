import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getNotifications } from '@/services/notification.service'
import { useAuthStore } from '@/stores/auth.store'

/**
 * notification.store - notifikasi pengajuan surat & aduan baru dari publik.
 *
 * Cara kerja:
 * - Polling ke endpoint notifikasi backend tiap POLL_INTERVAL_MS, dan langsung
 *   saat tab kembali aktif.
 * - Yang dianggap notifikasi = pengajuan surat berstatus `submitted` dan aduan
 *   berstatus `Submitted` (menunggu tindakan admin). Surat yang dibuat manual
 *   oleh petugas (source "Manual ...") tidak dihitung karena bukan dari publik.
 * - Begitu admin memverifikasi/menolak, item otomatis hilang dari daftar.
 * - "Sudah dibaca" disimpan per akun di localStorage.
 * - Item yang muncul SETELAH polling pertama memicu callback `onNew` (dipakai
 *   Toast di NotificationBell). Polling pertama hanya jadi baseline.
 *
 */

const POLL_INTERVAL_MS = 30_000
const MIN_GAP_MS = 5_000
const MAX_ITEMS = 30
const STORAGE_PREFIX = 'sibimo_notif_read:'

function normalizeNotification(item) {
  return {
    key: item.key,
    type: item.type,
    title: item.title || (item.type === 'letter' ? 'Pengajuan surat baru' : 'Aduan baru'),
    from: item.from || (item.type === 'letter' ? 'Pemohon' : 'Anonim'),
    time: item.time ?? null,
    to: item.to,
  }
}

async function loadNotifications() {
  const list = await getNotifications()

  return (Array.isArray(list) ? list : []).map(normalizeNotification)
}

export const useNotificationStore = defineStore('notification', () => {
  const authStore = useAuthStore()
  const letterItems = ref([])
  const complaintItems = ref([])
  const readKeys = ref(new Set())
  const lastFetchedAt = ref(null)
  const loadFailed = ref(false)

  let userKey = 'anon'
  let started = false
  let inflight = false
  let lastRun = 0
  let timer = null
  let onNew = null
  const known = new Set()
  const seeded = { letter: false, complaint: false }

  const allItems = computed(() =>
    [...letterItems.value, ...complaintItems.value]
      .map((item) => ({ ...item, read: readKeys.value.has(item.key) }))
      .sort((a, b) => new Date(b.time ?? 0) - new Date(a.time ?? 0)),
  )
  const items = computed(() => allItems.value.slice(0, MAX_ITEMS))
  const unreadCount = computed(() => allItems.value.filter((item) => !item.read).length)
  const pendingLetterCount = computed(() => letterItems.value.length)
  const pendingComplaintCount = computed(() => complaintItems.value.length)

  function persistRead() {
    try {
      localStorage.setItem(STORAGE_PREFIX + userKey, JSON.stringify([...readKeys.value]))
    } catch {
      /* localStorage penuh/diblokir: abaikan, state tetap jalan di memori */
    }
  }

  function loadRead() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_PREFIX + userKey) ?? '[]')
      readKeys.value = new Set(Array.isArray(raw) ? raw : [])
    } catch {
      readKeys.value = new Set()
    }
  }

  function markRead(key) {
    if (!key || readKeys.value.has(key)) return
    readKeys.value = new Set([...readKeys.value, key])
    persistRead()
  }

  function markAllRead() {
    if (unreadCount.value === 0) return
    readKeys.value = new Set([...readKeys.value, ...allItems.value.map((item) => item.key)])
    persistRead()
  }

  // Terapkan hasil satu sumber: deteksi item baru, buang read-key yang sudah tidak pending.
  function applySource(kind, list, target) {
    const fresh = seeded[kind] ? list.filter((item) => !known.has(item.key)) : []
    list.forEach((item) => known.add(item.key))
    seeded[kind] = true
    target.value = list

    const current = new Set(list.map((item) => item.key))
    const kept = [...readKeys.value].filter(
      (key) => !key.startsWith(`${kind}:`) || current.has(key),
    )
    if (kept.length !== readKeys.value.size) {
      readKeys.value = new Set(kept)
      persistRead()
    }
    return fresh
  }

  async function refresh({ force = false } = {}) {
    if (!started || inflight) return
    if (!force && Date.now() - lastRun < MIN_GAP_MS) return
    inflight = true
    lastRun = Date.now()

    try {
      const notifications = await loadNotifications()
      if (!started) return

      const letters = notifications.filter((item) => item.type === 'letter')
      const complaints = notifications.filter((item) => item.type === 'complaint')
      const arrivals = [
        ...applySource('letter', letters, letterItems),
        ...applySource('complaint', complaints, complaintItems),
      ]

      loadFailed.value = false
      lastFetchedAt.value = Date.now()
      if (arrivals.length > 0 && onNew) onNew(arrivals)
    } catch (error) {
      loadFailed.value = true
    } finally {
      inflight = false
    }
  }

  function handleVisibility() {
    if (document.visibilityState === 'visible') refresh()
  }

  function start(callback) {
    if (started) return
    const user = authStore.user
    userKey = String(user?.user_id ?? user?.id ?? user?.username ?? 'anon')
    onNew = callback ?? null
    loadRead()
    started = true
    refresh({ force: true })
    timer = setInterval(refresh, POLL_INTERVAL_MS)
    document.addEventListener('visibilitychange', handleVisibility)
  }

  function stop() {
    started = false
    clearInterval(timer)
    timer = null
    onNew = null
    document.removeEventListener('visibilitychange', handleVisibility)
    known.clear()
    seeded.letter = false
    seeded.complaint = false
    letterItems.value = []
    complaintItems.value = []
    lastFetchedAt.value = null
    loadFailed.value = false
  }

  return {
    items,
    unreadCount,
    pendingLetterCount,
    pendingComplaintCount,
    lastFetchedAt,
    loadFailed,
    start,
    stop,
    refresh,
    markRead,
    markAllRead,
  }
})
