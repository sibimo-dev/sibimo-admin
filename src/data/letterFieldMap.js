/* PEMETAAN FIELD FRONTEND -> FIELD BACKEND (letter_type_fields) untuk SEMUA surat.

   Isian di form memakai key bahasa Inggris (fatherNik, brideBirthPlace, ...), sedangkan field backend
   diberi nama bahasa Indonesia oleh admin (nik_ayah, tempat_lahir_mempelai_wanita, ...). Pencocokan dilakukan
   berurutan di services/letter-create.service.js:
     1) OVERRIDE di bawah (paling kuat)  2) key persis / alias  3) kata-per-kata (file ini, urutan kata bebas).
   Kalau ada field yang belum cocok, buka halaman  /letter/mapping-check  (membandingkan SEMUA surat dengan
   backend), lalu isi override di sini. */

/* Override eksplisit (key di form -> field_key di backend). DIHASILKAN dari perbandingan form frontend dengan
   seeder/katalog backend (laporan-mismatch-surat.md). Hanya pasangan yang yakin (nama + peran orang + konteks seksi
   cocok). Pasangan yang ragu ada di letter-mapping-review.md dan harus diputuskan manual.
   Format: { "<slug>": { "<key di form>": "<field_key di backend>" } } */
export const FIELD_OVERRIDES = {
  /* Nama penandatangan (opsional) — key unik per jabatan, jadi aman dipasang untuk semua surat.
     field_key di sisi kanan HARUS dibuat di letter_type_fields (type text, tidak wajib) pada surat terkait;
     kalau belum ada di backend, pasangan ini otomatis dilewati dan terdaftar di /letter/mapping-check. */
  "*": {
    hamletHeadName: "nama_dukuh", // tiga kata (hamlet+head+name) tidak cocok otomatis dengan "Nama Dukuh"
    districtHeadName: "nama_camat",
    rtHeadName: "nama_ketua_rt",
    rwHeadName: "nama_ketua_rw",
    registrarName: "nama_petugas_registrasi",
    officerName: "nama_petugas",
    districtOfficerName: "nama_petugas_kecamatan",
    receivingOfficerName: "nama_petugas_penerima_berkas",
    notaryName: "nama_notaris",
    departmentHeadName: "nama_kepala_dinas",
    departmentHeadNip: "nip_kepala_dinas",
  },
  "income-permit-letter": {
    purpose: "dipergunakan_untuk", // manual
  },
  "birth-attestation-letter": {
    marriageRecordDate: "tanggal_pencatatan_perkawinan",
    reporterReportDate: "tanggal_lapor",
    childDeliveryPlace: "tempat_dilahirkan",
    childBirthPlace: "tempat_kelahiran_kota",
    childBirthTime: "jam_kelahiran",
    childPlurality: "jenis_kelahiran",
    childBirthOrder: "kelahiran_ke",
    childBirthAttendant: "penolong_kelahiran",
    childWeight: "berat_bayi",
    childLength: "panjang_bayi",
    marriageRecordPlace: "tempat_pencatatan_perkawinan",
    childBirthDate: "hari_tanggal_lahir",
  },
  "birth-certificate-application-form": {
    reporterPhone: "kontak_pelapor",
  },
  "birth-report-form": {
    marriageRecordDate: "tanggal_pencatatan_perkawinan",
    reporterReportDate: "tanggal_lapor",
    childDeliveryPlace: "tempat_dilahirkan",
    childBirthPlace: "tempat_kelahiran_kota",
    childBirthTime: "jam_kelahiran",
    childPlurality: "jenis_kelahiran",
    childBirthOrder: "kelahiran_ke",
    childBirthAttendant: "penolong_kelahiran",
    childWeight: "berat_bayi",
    childLength: "panjang_bayi",
    marriageRecordPlace: "tempat_pencatatan_perkawinan",
    childBirthDate: "hari_tanggal_lahir",
  },
  "birth-report-statement": {
    reporterRelationship: "hubungan_dengan_bayi",
  },
  "death-certificate": {
    reporterReportDate: "tanggal_lapor",
  },
  "death-certificate-application": {
    reportType: "jenis_pelaporan",
    deathDate: "meninggal_hari_tanggal",
    deathPlace: "kota_tempat_meninggal",
    reporterApplicationDate: "tanggal_lapor",
  },
  "death-registration-report": {
    deathDate: "meninggal_hari_tanggal",
    witness1BirthDate: "ttl_saksi_1",
    witness2BirthDate: "ttl_saksi_2",
    deathPlace: "kota_tempat_meninggal",
  },
  "death-report": {
  },
  "death-report-form": {
    reportType: "jenis_pelaporan", // blok Data Administrasi (Jenis Pelaporan) kini ada di form ini; pastikan field-nya ada di backend
    reporterReportDate: "tanggal_lapor",
    deathPlace: "kota_tempat_meninggal",
  },
  "domicile-certificate": {
    buildingUsage: "kegunaan_bangunan",
  },
  "duty-travel-order-letter": {
    returnDueDate: "tanggal_kembali",
    employeeRank: "pangkat_golongan",
    employeePosition: "jabatan",
    purpose: "maksud_perjalanan",
    transport: "alat_angkutan",
    companions: "pengikut",
    budgetItem: "anggaran_mata_anggaran",
    notes: "keterangan_lain",
    issuingOfficial: "pejabat_berwenang",
  },
  "event-permit-letter": {
    eventDate: "pada_hari_tanggal",
    eventTime: "jam",
    eventPlace: "tempat",
    eventParticipants: "peserta",
    eventObjective: "tujuan",
    responsiblePerson: "penanggung_jawab",
  },
  "fuel-recommendation-letter": {
    volumeAllocation: "alokasi_volume",
    pickupLocation: "tempat_pengambilan",
    distributorNumber: "nomor_lembaga_penyalur",
  },
  "general-statement-letter": {
    purpose: "menerangkan_bahwa",
  },
  "guardian-statement": {
    guardianRelation: "hubungan_wali_nasab",
  },
  "health-referral": {
    conduct: "kelakuan",
    note: "keterangan_lain",
  },
  "judge-guardian": {
    judgeGuardianReason: "sebab_wali_hakim",
  },
  "kia-application-form": {
    householdHead: "nama_kepala_keluarga", // manual
    bloodType: "golongan_darah_anak",
    // Data anak vs penandatangan pemohon (orang tua/wali): dipisah eksplisit supaya alias generik `name`/`nik`
    // (-> nama_pemohon / nik_pemohon) tidak menimpa data anak.
    name: "nama_anak",
    nik: "nik_anak",
    birthPlace: "tempat_lahir_anak",
    birthDate: "tanggal_lahir_anak",
    gender: "jenis_kelamin_anak",
    religion: "agama_anak",
    applicantName: "nama_pemohon",
    applicantNik: "nik_pemohon",
  },
  "land-origin-certificate-letter": {
    measurementLetterDate: "land_measurement_letter_date",
    area: "land_area",
    measurementLetterNumber: "land_measurement_letter_number",
    areaInWords: "land_area_in_words",
    certificateNumber: "land_certificate_number",
  },
  "land-price-certificate-letter": {
    area: "land_area",
    certificateNumber: "land_certificate_number",
    priceMin: "land_price_min",
    priceMax: "land_price_max",
  },
  "lease-offer-letter": {
    recipientName: "ditujukan_kepada",
    recipientAddress: "lokasi_tujuan_surat",
    leaseBuildingName: "nama_gedung",
    leaseBuildingAddress: "alamat_gedung",
    leaseEndDate: "tanggal_berakhir_sewa_lama",
    leaseAnnualRent: "harga_sewa_per_tahun",
    leaseDurationYears: "lama_sewa_tahun",
  },
  "letter-c-data-statement-letter": {
    purposeType: "purpose",
    hamletHeadName: "dukuh_name",
  },
  "n2": {
    akadDate: "hari_tanggal_akad",
  },
  "out-of-domicile-birth-report": {
    marriageRecordDate: "tanggal_pencatatan_perkawinan",
    reporterReportDate: "tanggal_lapor",
    childDeliveryPlace: "tempat_dilahirkan",
    childBirthPlace: "tempat_kelahiran_kota",
    childBirthTime: "jam_kelahiran",
    childPlurality: "jenis_kelahiran",
    childBirthAttendant: "penolong_kelahiran",
    childWeight: "berat_bayi",
    childLength: "panjang_bayi",
    marriageRecordPlace: "tempat_pencatatan_perkawinan",
    childBirthDate: "hari_tanggal_lahir",
    childBirthOrder: "anak_ke",
  },
  "parental-consent-letter": {
    fatherName: "groom_father_name",
    fatherNik: "groom_father_nik",
    fatherAddress: "groom_father_address",
    motherName: "groom_mother_name",
    motherNik: "groom_mother_nik",
    motherAddress: "groom_mother_address",
  },
  "permit-followup-letter": {
    recipientName: "ditujukan_kepada",
    recipientAddress: "lokasi_tujuan_surat",
    refLetterNumber: "nomor_surat_asal",
    eventDate: "tanggal_kegiatan",
    eventEndDate: "tanggal_selesai_kegiatan",
    eventTime: "waktu_kegiatan",
    eventEndTime: "waktu_selesai_kegiatan",
    eventObjective: "nama_acara",
    eventPlace: "tempat_kegiatan",
  },
  "registration-form": {
    // PNP memiliki dua field status yang sama-sama berlabel "Status".
    // Tanpa override, mapper berdasarkan label akan memasukkan status catin
    // pria ke field status catin putri dan backend menolaknya.
    groomStatus: "status_catin_putra",
    brideStatus: "status_catin_putri",
    groomName: "nama_suami_terdahulu",
    groomNik: "nik_suami_terdahulu",
    groomNationality: "kewarganegaraan_suami_terdahulu",
    groomAddress: "alamat_suami_terdahulu",
    groomBin: "bin_suami_terdahulu",
  },
  "relocation-certificate-form": {
    headOfFamily: "origin_head_of_family",
    kkNumber: "origin_kk_number",
    originKkStatus: "origin_kk_status_code",
    destinationKkStatus: "destination_kk_status_code",
  },

  "relocation-cover-letter": {
    headOfFamily: "nama_kepala_keluarga",
    relocationReason: "alasan_pindah",
    originKkStatus: "status_kk_tidak_pindah",
    destinationKkStatus: "status_kk_pindah",
  },
  "research-response-letter": {
    recipientName: "ditujukan_kepada",
    refLetterNumber: "nomor_surat_asal",
    researcherName: "nama_mahasiswa",
    researcherNim: "nim",
    researcherStudyProgram: "program_studi",
    researcherFaculty: "fakultas",
  },
  "sktm-general": {
    kkmNumber: "nomor_kkm_krm",
  },
};

/* Isian berulang (rows) -> field backend bernomor. Contoh: familyMembers[i].nik -> nik_pindah_{i+1}.
   max = jumlah baris yang tersedia di backend; baris berlebih dibuang (ada peringatan di console). */
export const ROW_OVERRIDES = {
  "relocation-cover-letter": {
    familyMembers: { max: 7, columns: { nik: "nik_pindah", name: "nama_pindah", validUntil: "masa_berlaku_ktp", shdk: "shdk" } },
  },
  "spousal-relationship-responsibility-statement": {
    marriageWitnesses: { max: 2, columns: { name: "nama_saksi", nik: "nik_saksi" } },
  },
  // Tembusan bisa ditambah: carbonCopies[i].name -> tembusan_{i+1} (tembusan_1 .. tembusan_10 harus ada di backend)
  "permit-followup-letter": {
    carbonCopies: { max: 10, columns: { name: "tembusan" } },
  },
};

/* Satu baris = satu "makna". Kata Inggris & Indonesia di baris yang sama dianggap sama. */
const GROUPS = [
  ["name", "nama"], ["address", "alamat"], ["birth", "lahir", "kelahiran"], ["place", "tempat"],
  ["date", "tanggal", "tgl"], ["father", "ayah", "bapak"], ["mother", "ibu"],
  ["bride", "wife", "istri", "wanita", "pengantin", "perempuan"], ["groom", "husband", "suami", "pria"],
  ["spouse", "pasangan"], ["nik"], ["occupation", "job", "pekerjaan"], ["child", "children", "anak"],
  ["witness", "witnesses", "saksi"], ["reporter", "informant", "pelapor"], ["religion", "agama"],
  ["deceased", "almarhum", "almarhumah", "jenazah"], ["death", "died", "meninggal", "kematian", "wafat"],
  ["nationality", "citizenship", "kewarganegaraan", "kebangsaan"], ["destination", "tujuan"],
  ["purpose", "keperluan", "need", "necessity", "kebutuhan"], ["gender", "kelamin", "sex"],
  ["family", "keluarga"], ["card", "kartu"], ["kk"], ["origin", "asal"], ["number", "nomor", "no"],
  ["status"], ["marital", "perkawinan", "kawin"], ["marriage", "nikah", "pernikahan"], ["bin", "binti"],
  ["education", "pendidikan"], ["attorney", "penerima"], ["grantor", "pemberi"], ["power", "kuasa"],
  ["head", "kepala"], ["prev", "previous", "sebelumnya", "sebelum"], ["ex", "mantan"],
  ["applicant", "pemohon"], ["time", "waktu", "jam"], ["age", "umur", "usia"],
  ["village", "desa", "kelurahan", "kalurahan"], ["district", "kecamatan", "kapanewon"],
  ["regency", "kabupaten"], ["city", "kota"], ["province", "provinsi"], ["hamlet", "dusun", "padukuhan", "dukuh"],
  ["rt"], ["rw"], ["postal", "pos"], ["code", "kode"], ["member", "members", "anggota"],
  ["phone", "telepon", "telp", "hp", "whatsapp", "wa"], ["akad"], ["reason", "reasons", "alasan"],
  ["order", "urutan"], ["guardian", "wali"], ["type", "types", "jenis"], ["relocation", "pindah", "kepindahan"],
  ["request", "permohonan", "permintaan"], ["other", "lain", "lainnya"], ["delivery", "pengiriman"],
  ["student", "siswa", "murid", "pelajar"], ["parent", "orangtua", "ortu"], ["guarantor", "penjamin"],
  ["day", "hari"], ["report", "laporan", "lapor"], ["business", "usaha"], ["location", "lokasi"],
  ["weight", "berat"], ["length", "panjang"], ["event", "acara", "kegiatan"], ["cause", "penyebab", "sebab"],
  ["area", "luas", "wilayah"], ["certificate", "cert", "akta", "sertifikat"], ["employee", "karyawan", "pegawai"],
  ["change", "changes", "perubahan"], ["tenant", "penyewa"], ["researcher", "peneliti"], ["research", "penelitian"],
  ["building", "bangunan"], ["income", "penghasilan", "pendapatan"], ["note", "notes", "catatan", "keterangan"],
  ["price", "harga"], ["rent", "sewa"], ["distributor", "penyalur"], ["host", "tuan"], ["ethnicity", "suku"],
  ["relationship", "relation", "hubungan"], ["year", "tahun"], ["month", "bulan"], ["responsible", "penanggung"],
  ["person", "orang"], ["count", "total", "jumlah"], ["owner", "pemilik"], ["company", "perusahaan"],
  ["activity", "kegiatan"], ["domicile", "domisili"], ["blood", "darah"], ["household", "rumah"],
  ["start", "mulai"], ["end", "akhir", "berakhir"], ["valid", "berlaku"], ["until", "hingga", "sampai"],
  ["departure", "keberangkatan", "berangkat"], ["return", "kembali"], ["duration", "lama", "durasi"],
  ["agency", "instansi", "institution", "lembaga"], ["rank", "pangkat"], ["position", "jabatan"],
  ["subject", "perihal"], ["result", "hasil"], ["budget", "anggaran"], ["cost", "biaya"], ["method", "metode"],
  ["class", "kelas"], ["school", "sekolah"], ["title", "judul"], ["program", "prodi"], ["office", "kantor"],
  ["official", "pejabat"], ["property", "properti"], ["land", "tanah"], ["terms", "ketentuan", "syarat"],
  ["conditions", "condition", "kondisi"], ["response", "tanggapan", "balasan"], ["participants", "peserta"],
  ["objective", "tujuan_kegiatan"], ["gestational", "kehamilan"], ["height", "tinggi"],
  ["1", "satu", "i", "pertama"], ["2", "dua", "ii", "kedua"], ["3", "tiga", "iii", "ketiga"],
  ["4", "empat", "iv", "keempat"], ["5", "lima", "v", "kelima"],
];

/* Frasa dua kata -> satu makna (urutan bebas). */
const PHRASES = [
  [["family", "card"], "kk"], [["kartu", "keluarga"], "kk"], [["jenis", "kelamin"], "gender"],
  [["kode", "pos"], "postal"], [["postal", "code"], "postal"], [["penanggung", "jawab"], "responsible"],
  [["penerima", "kuasa"], "attorney"], [["pemberi", "kuasa"], "grantor"], [["tempat", "tinggal"], "address"],
  [["nama", "lengkap"], "name"], [["full", "name"], "name"], [["no", "hp"], "phone"],
];

const STOP = new Set(["of", "di", "ke", "yang", "dan", "the", "and", "lengkap", "surat", "untuk", "dari", "pada", "full", "calon", "mempelai"]);

const GROUP_OF = new Map();
GROUPS.forEach((g, i) => g.forEach((t) => { if (!GROUP_OF.has(t)) GROUP_OF.set(t, "g" + i); }));

export function tokenize(text) {
  return String(text ?? "")
    .replace(/\([^)]*\)/g, " ") // "Binti (nama ayah)" -> "Binti"
    .replace(/^\s*(?:\d+\s*[.)]|[a-zA-Z][.)]\s+)\s*/, " ") // "1. Nomor KK" / "a. Desa" -> nomor di depan label dibuang
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function applyPhrases(tokens) {
  let out = [...tokens];
  for (const [pair, canon] of PHRASES) {
    for (let i = 0; i < out.length - 1; i++) {
      const [a, b] = [out[i], out[i + 1]];
      if ((a === pair[0] && b === pair[1]) || (a === pair[1] && b === pair[0])) { out.splice(i, 2, canon); i--; }
    }
  }
  return out;
}

/* "Tanda tangan" sebuah nama field: himpunan makna, urutan kata & bahasa tidak berpengaruh.
   fatherBirthPlace == tempat_lahir_ayah == "Tempat Lahir Ayah". */
export function signature(text) {
  const set = new Set(
    applyPhrases(tokenize(text)).filter((t) => !STOP.has(t)).map((t) => GROUP_OF.get(t) ?? t),
  );
  return [...set].sort().join("|");
}

/* Field backend yang SATU-SATUNYA cocok dengan key form (lewat field_key atau field_label). */
export function matchBySignature(key, backendFields, isFree = () => true) {
  const sig = signature(key);
  if (!sig) return null;
  const hits = backendFields.filter(
    (f) => isFree(f.field_key) && (signature(f.field_key) === sig || signature(f.field_label) === sig),
  );
  return hits.length === 1 ? hits[0].field_key : null;
}

export const overrideFor = (slug, key) => FIELD_OVERRIDES[slug]?.[key] ?? FIELD_OVERRIDES["*"]?.[key] ?? null;
export const rowsFor = (slug, key) => ROW_OVERRIDES[slug]?.[key] ?? null;