/* Surat/dokumen yang bisa dipilih saat mendaftar sebagai warga baru.
   `types` = jenis pendaftaran yang memunculkan dokumen ini (lihat RESIDENT_TYPES; satu dokumen boleh untuk beberapa jenis).
   `hue`   = warna kartu/ikon, dibuat berbeda untuk tiap dokumen (nama hue ada di layout/pastel.js).
   `code`  = kode singkat di kartu & kode pengajuan.
   `separate` = true → tiap surat di `letters` jadi langkah isian sendiri, tidak digabung ke satu halaman.
   `letters` = slug berkas surat di views/services/letters/<group>/<slug>.vue. Isian & dokumen pendukung DIBACA dari berkas surat itu
               (export `sections` & `documents`), jadi mengubah isian cukup di berkas suratnya, bukan di sini.
               Bila 1 dokumen memakai beberapa surat, isiannya digabung dalam satu halaman. */
export const REGISTRATION_DOCS = [
  {
    value: "ktp", code: "KTP", types: ["tetap"], hue: "sky", label: "KTP", icon: "pi pi-id-card",
    description: "Pendaftaran / pembuatan KTP.",
    letters: ["ktp-application-form"],
  },
  {
    value: "kk", code: "KK", types: ["tetap"], hue: "emerald", label: "Kartu Keluarga", icon: "pi pi-users",
    description: "Masuk / pembuatan Kartu Keluarga.",
    letters: ["population-occurrence-registration", "family-biodata"],
  },
  {
    value: "akta-kelahiran", code: "AKL", types: ["tetap"], hue: "rose", label: "Akta Kelahiran", icon: "pi pi-heart",
    description: "Pencatatan data kelahiran.",
    letters: ["birth-certificate-application-form"],
  },
  {
    value: "permohonan-pindah-datang", code: "SKD", types: ["tetap"], hue: "teal", label: "Formulir Permohonan Pindah Datang WNI", icon: "pi pi-sign-in",
    description: "Permohonan pindah datang bagi WNI yang akan menjadi warga baru.",
    letters: ["resident-arrival-form"],
  },
  {
    value: "permohonan-penduduk-sementara-skts", code: "PPS", types: ["sementara"], hue: "amber", label: "Permohonan Menjadi Penduduk Sementara / SKTS", icon: "pi pi-clock",
    description: "Permohonan menjadi penduduk sementara (SKTS) bagi pendatang.",
    letters: ["temporary-resident-request"],
  },
  {
    value: "permohonan-tinggal-sementara", code: "TSM", types: ["tinggal-sementara"], hue: "fuchsia", label: "Permohonan Tinggal Sementara", icon: "pi pi-home",
    description: "Permohonan tinggal sementara di wilayah ini.",
    letters: ["temporary-stay-application-form"],
  },
  {
    value: "pengantar-pindah-wni", code: "PPN", types: ["tetap"], hue: "lime", label: "Permohonan Pindah WNI", icon: "pi pi-file-export",
    description: "Pindah antar desa dalam satu kecamatan. Terdiri dari Surat Pengantar Permohonan Pindah WNI dan Formulir Keterangan Pindah WNI, diisi dalam satu pengajuan.",
    separate: true, // 1 kartu pilihan, tapi tiap surat = satu langkah isian sendiri (tidak digabung)
    letters: ["relocation-cover-letter", "relocation-certificate-form"],
  },
  {
    value: "akta-nikah", code: "PNB", types: ["tetap"], hue: "violet", label: "Akta / Buku Nikah", icon: "pi pi-star",
    description: "Pencatatan status perkawinan.",
    letters: ["unregistered-marriage-responsibility-letter"],
  },
];

/* Jenis pendaftaran yang dipilih pada pop-up setelah NIK tidak ditemukan.
   Menentukan dokumen mana yang tampil di langkah "Pilih Surat" (lewat `types` di REGISTRATION_DOCS). */
export const RESIDENT_TYPES = [
  { value: "tetap", label: "Penduduk Tetap", description: "Pindah dan menetap di kalurahan ini.", icon: "pi pi-home", hue: "emerald" },
  { value: "sementara", label: "Penduduk Sementara", description: "Pendatang yang tinggal sementara dengan SKTS.", icon: "pi pi-clock", hue: "amber" },
  { value: "tinggal-sementara", label: "Tinggal Sementara", description: "Tinggal sementara di wilayah ini.", icon: "pi pi-map-marker", hue: "sky" },
];

export const residentTypeOf = (value) => RESIDENT_TYPES.find((t) => t.value === value) ?? null;

// Tanpa jenis (mis. halaman dibuka langsung lewat URL) → tampilkan semua dokumen.
export const docsForType = (type) => (type ? REGISTRATION_DOCS.filter((d) => d.types.includes(type)) : REGISTRATION_DOCS);