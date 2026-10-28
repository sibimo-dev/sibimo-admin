/**
 * Tombol "Kembali" global (components/layout/Breadcrumb.vue) memanggil handler ini lebih dulu.
 * Dipakai halaman yang punya "layar" internal tanpa ganti URL (mis. Tambah Surat: kelompok -> katalog -> formulir),
 * supaya Kembali mundur satu layar dulu, bukan langsung keluar halaman.
 *
 * Pemakaian di <script setup>:
 *   useBackHandler(() => {
 *     if (view.value === 'groups') return false   // false = tidak ditangani -> kembali ke halaman sebelumnya
 *     view.value = 'groups'
 *     return true                                  // true = sudah ditangani di halaman ini
 *   })
 */
import { onBeforeUnmount } from 'vue'

let current = null

export function useBackHandler(fn) {
  current = fn
  onBeforeUnmount(() => {
    if (current === fn) current = null
  })
}

export function runBackHandler() {
  return typeof current === 'function' ? current() === true : false
}