// src/services/agenda-period.js
// Menyimpan bulan & tahun yang sedang dilihat di list agenda, supaya tidak
// kembali ke bulan sekarang saat pindah ke halaman detail lalu kembali.
import { reactive, watch } from 'vue'

const STORAGE_KEY = 'agenda-period'

function load() {
  const now = new Date()
  const fallback = { month: now.getMonth(), year: now.getFullYear() }

  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY))
    if (Number.isInteger(saved?.month) && Number.isInteger(saved?.year)) return saved
  } catch {
    // abaikan, pakai bulan sekarang
  }

  return fallback
}

export const agendaPeriod = reactive(load())

watch(agendaPeriod, (value) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ month: value.month, year: value.year }))
  } catch {
    // sessionStorage tidak tersedia
  }
})

export function setAgendaPeriod(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return
  agendaPeriod.month = date.getMonth()
  agendaPeriod.year = date.getFullYear()
}