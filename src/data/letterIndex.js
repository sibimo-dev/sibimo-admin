/* DAFTAR SEMUA SURAT (satu baris per berkas di data/letters/<kelompok>/<slug>.js).
   Kolom: [slug, kelompok(folder), kategori(tab), judul, kode]
   Daftar & isiannya disalin dari public (data/letterRegistry.js + views/services/layout/letterIndex.js).
   Tambahan khusus admin: kelompok "replies" (3 surat Balasan) — berkasnya belum ada di public. */
export const LETTER_CATEGORIES = [
  {
    "value": "permohonan",
    "label": "Permohonan"
  },
  {
    "value": "pernyataan",
    "label": "Pernyataan"
  },
  {
    "value": "keterangan",
    "label": "Keterangan"
  },
  {
    "value": "perintah",
    "label": "Perintah"
  },
  {
    "value": "balasan",
    "label": "Balasan"
  },
  {
    "value": "pengantar",
    "label": "Pengantar"
  }
];

export const LETTER_INDEX = [
  ["ktp-application-form", "applications", "permohonan", "Surat Permohonan KTP", "KTP"],
  ["resident-arrival-form", "applications", "permohonan", "Formulir Permohonan Pindah Datang WNI", "SKD"],
  ["kia-application-form", "applications", "permohonan", "Surat Permohonan Penerbitan KIA", "KIA"],
  ["temporary-resident-request", "applications", "permohonan", "Surat Permohonan Menjadi Penduduk Sementara / SKTS", "PPS"],
  ["divorce-lawsuit-letter", "applications", "permohonan", "Surat Permohonan Cerai", "GCR"],
  ["fuel-recommendation-letter", "applications", "permohonan", "Surat Rekomendasi Pembelian Jenis BBM Tertentu", "BBM"],
  ["temporary-stay-application-form", "applications", "permohonan", "Permohonan Tinggal Sementara", "TSM"],
  ["relocation-cover-letter", "applications", "permohonan", "Surat Pengantar Permohonan Pindah WNI", "PPN"],
  ["relocation-certificate-form", "applications", "permohonan", "Formulir Keterangan Pindah WNI", "SKP"],
  ["population-occurrence-registration", "applications", "permohonan", "Formulir Pendaftaran Peristiwa Kependudukan", "PPK"],
  ["family-biodata", "applications", "permohonan", "Formulir Biodata Penduduk WNI (Per Keluarga)", "BDK"],
  ["birth-certificate-application-form", "birth", "permohonan", "Permohonan Akta Kelahiran", "AKL"],
  ["birth-report-form", "birth", "permohonan", "Formulir Pelaporan Kelahiran (Untuk Mendapatkan Akta Kelahiran)", "LPK"],
  ["death-certificate-application", "death", "permohonan", "Permohonan Akta Kematian", "AKM"],
  ["death-report-form", "death", "permohonan", "Formulir Pelaporan Kematian (Untuk Mendapatkan Akta Kematian)", "LPM"],
  ["marriage-application-letter", "married-man", "permohonan", "Permohonan Kehendak Nikah", "KHN"],
  ["marriage-registration-data-sheet", "married-man", "permohonan", "Data Isian Pendaftaran Nikah", "DPN"],
  ["registration-form", "marriage-women", "permohonan", "Data Isian Pendaftaran Nikah", "FPN"],
  ["identity-discrepancy-statement-letter", "declarations", "pernyataan", "Surat Pernyataan Beda Nama/Identitas", "PPI"],
  ["statement-population-data-change", "declarations", "pernyataan", "Surat Pernyataan Perubahan Elemen Data Kependudukan", "PDP"],
  ["population-document-statement-letter", "declarations", "pernyataan", "Surat Pernyataan Tidak Memiliki Dokumen Kependudukan", "PDK"],
  ["unregistered-marriage-responsibility-letter", "declarations", "pernyataan", "Surat Pernyataan Tanggung Jawab Mutlak Perkawinan Belum Tercatat", "PNB"],
  ["heir-power-of-attorney-letter", "declarations", "pernyataan", "Surat Kuasa Sidang Waris", "KAW"],
  ["population-service-authorization-letter", "declarations", "pernyataan", "Surat Kuasa Dalam Pelayanan Administrasi Kependudukan", "KPK"],
  ["birth-report-statement", "birth", "pernyataan", "Laporan Kelahiran", "PLK"],
  ["spousal-relationship-responsibility-statement", "birth", "pernyataan", "Surat Pernyataan Tanggung Jawab Mutlak Kebenaran Sebagai Pasangan Suami Istri", "PHS"],
  ["birth-certificate-power-of-attorney", "birth", "pernyataan", "Surat Kuasa", "KAK"],
  ["death-general-statement", "death", "pernyataan", "Surat Keterangan Mohon Akta Kematian", "PKU"],
  ["death-data-statement", "death", "pernyataan", "Surat Pernyataan Tanggung Jawab Mutlak (SPTJM) Kebenaran Data Kematian", "PDM"],
  ["death-power-of-attorney", "death", "pernyataan", "Surat Kuasa", "KKM"],
  ["letter-c-data-statement-letter", "letter-c", "pernyataan", "Surat Pernyataan Permohonan Data Letter C", "PLC"],
  ["power-of-attorney-letter", "letter-c", "pernyataan", "Surat Kuasa", "KLC"],
  ["not-remarried-statement-letter", "married-man", "pernyataan", "Surat Keterangan Belum Menikah Lagi", "PBM"],
  ["parental-consent-letter", "married-man", "pernyataan", "Surat Izin Orang Tua", "SOT"],
  ["bride-groom-consent-letter", "married-man", "pernyataan", "Persetujuan Calon Pengantin", "SCM"],
  ["guardian-statement", "marriage-women", "pernyataan", "Surat Keterangan Wali Nikah", "PWN"],
  ["unmarried-statement", "marriage-women", "pernyataan", "Surat Keterangan Belum Menikah Lagi", "PBN"],
  ["unmarried-status-letter", "certificates", "keterangan", "Surat Keterangan Belum Kawin", "KSB"],
  ["bussiness-permit-letter", "certificates", "keterangan", "Surat Keterangan Usaha", "IZU"],
  ["general-statement-letter", "certificates", "keterangan", "Surat Keterangan Umum", "SPU"],
  ["domicile-certificate", "certificates", "keterangan", "Surat Keterangan Domisili", "KDM"],
  ["sktm-general", "certificates", "keterangan", "Surat Keterangan Tidak Mampu", "SKTM"],
  ["sktm-school", "certificates", "keterangan", "Surat Keterangan Tidak Mampu Sekolah", "SKTS"],
  ["income-permit-letter", "certificates", "keterangan", "Surat Keterangan Penghasilan", "KPH"],
  ["event-permit-letter", "certificates", "keterangan", "Surat Keterangan Keramaian", "IZK"],
  ["travel-permit-letter-gov", "certificates", "keterangan", "Surat Keterangan Jalan", "IPI"],
  ["skck-referral-letter", "certificates", "keterangan", "Surat Keterangan Mohon SKCK", "SKCK"],
  ["legalization-register", "certificates", "keterangan", "Surat Legalisasi", "LGL"],
  ["birth-attestation-letter", "birth", "keterangan", "Surat Keterangan Kelahiran", "KLH"],
  ["death-certificate", "death", "keterangan", "Surat Keterangan Kematian", "KKT"],
  ["death-commemoration-calculation", "death", "keterangan", "Perhitungan Selamatan 3 Hari Sampai 1000 Hari", "HPK"],
  ["land-price-certificate-letter", "letter-c", "keterangan", "Surat Keterangan Harga Tanah", "KHT"],
  ["land-origin-certificate-letter", "letter-c", "keterangan", "Surat Keterangan Asal Tanah", "KAT"],
  ["never-married-certificate-letter", "married-man", "keterangan", "Surat Keterangan Belum Pernah Menikah", "KBP"],
  ["marriage-lodging-certificate-letter", "married-man", "keterangan", "Surat Keterangan Numpang Nikah", "KNN"],
  ["death-certificate-for-marriage-letter", "married-man", "keterangan", "Surat Keterangan Kematian", "KKN"],
  ["general-certificate-letter", "married-man", "keterangan", "Surat Pengantar Tes Kesehatan", "KUM"],
  ["unmarried-certificate", "marriage-women", "keterangan", "Surat Keterangan Belum Pernah Menikah", "KBM"],
  ["n1", "marriage-women", "keterangan", "Pengantar Nikah", "N1"],
  ["n2", "marriage-women", "keterangan", "Permohonan Kehendak Nikah", "N2"],
  ["n4", "marriage-women", "keterangan", "Persetujuan Calon Pengantin", "N4"],
  ["n5", "marriage-women", "keterangan", "Surat Izin Orang Tua", "N5"],
  ["n6", "marriage-women", "keterangan", "Surat Keterangan Kematian", "N6"],
  ["duty-travel-order-letter", "orders", "perintah", "SPPD", "SPPD"],
  ["late-birth-registration-approval-decree", "birth", "perintah", "Surat Pencatatan Kelahiran Terlambat", "SKT"],
  ["permit-followup-letter", "replies", "balasan", "Surat Tindak Lanjut Permohonan Izin", "TLP"],
  ["lease-offer-letter", "replies", "balasan", "Surat Penawaran Sewa Kontrak Gedung BRI Unit Ngemplak II", "SPS"],
  ["research-response-letter", "replies", "balasan", "Surat Balasan Penelitian", "BIP"],
  ["marriage-certificate-duplicate-letter", "cover-letters", "pengantar", "Surat Pengantar Duplikat Nikah", "DAN"],
  ["general-cover-letter", "cover-letters", "pengantar", "Surat Pengantar Umum", "PGU"],
  ["birth-certificate-referral-letter", "birth", "pengantar", "Surat Keterangan Mohon Akta Kelahiran", "PAK"],
  ["marriage-introduction-letter", "married-man", "pengantar", "Pengantar Nikah", "PNK"],
  ["marriage-lodging", "marriage-women", "pengantar", "Surat Keterangan Numpang Nikah", "PNN"],
  ["health-referral", "marriage-women", "pengantar", "Surat Pengantar Tes Kesehatan", "PKS"],
  ["judge-guardian", "marriage-women", "pengantar", "Surat Keterangan Wali Hakim", "PWH"],
  ["death-report", "death", "pengantar", "Laporan Kematian", "PLM"],
  ["death-registration-report", "death", "pengantar", "Pelaporan Pencatatan Kematian", "PCK"],
  ["birth-registration-report", "birth", "pengantar", "Pelaporan Pencatatan Kelahiran", "PCL"],
  ["out-of-domicile-birth-report", "birth", "pengantar", "Laporan Kelahiran Luar Domisili", "PLD"],
];
