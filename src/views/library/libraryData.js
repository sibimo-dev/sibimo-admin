import { ref, computed } from 'vue'

/**
 * Sumber data dummy BERSAMA untuk modul Perpustakaan (Katalog Buku,
 * Peminjaman, Pengembalian) -- supaya semua halaman baca dari array yang
 * SAMA, bukan salinan lokal masing-masing yang gampang beda isi.
 */

const TAMBAH_KATEGORI_BARU = '__new__'

// ===== Kategori buku (book_categories) =====
export const kategoriList = ref([
  { category_id: 1, category_name: 'Sejarah' },
  { category_id: 2, category_name: 'Pertanian' },
  { category_id: 3, category_name: 'Novel' },
])

export const kategoriOptions = computed(() => [
  ...kategoriList.value.map((k) => ({ label: k.category_name, value: k.category_id })),
  { label: '+ Tambah kategori baru...', value: TAMBAH_KATEGORI_BARU },
])

export function namaKategori(categoryId) {
  return kategoriList.value.find((k) => k.category_id === categoryId)?.category_name || '-'
}

// ===== Buku (books, join book_categories) =====
// `category_id` dipakai sebagai sumber kebenaran (join ke kategoriList di
// atas) -- field nama kategori di modul lain (misal Peminjaman) diturunkan
// dari sini lewat namaKategori(), bukan disimpan dobel di sini.
export const bookList = ref([
  { book_id: 1, category_id: 1, title: 'Sejarah Perjuangan Kemerdekaan', author: 'Ahmad Wibowo', isbn: '978-602-1234-56-7', stock: 3 },
  { book_id: 2, category_id: 2, title: 'Teknik Pertanian Modern', author: 'Siti Rahayu', isbn: '978-602-9876-54-3', stock: 5 },
  { book_id: 3, category_id: 3, title: 'Laskar Pelangi', author: 'Andrea Hirata', isbn: '978-979-1227-78-0', stock: 0 },
])

// ===== Anggota/warga peminjam (citizens) =====
// TODO: ganti dengan GET /citizens -- ini tabel bersama semua modul
// (Peminjaman Buku, Pengajuan Surat, Pengaduan, dll), bukan cuma Perpustakaan.
export const citizenList = ref([
  { citizen_id: 1, full_name: 'Budi Santoso', national_id: '3301234567890001' },
  { citizen_id: 2, full_name: 'Siti Aminah', national_id: '3301234567890002' },
])

export { TAMBAH_KATEGORI_BARU }