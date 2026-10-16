/* PEMETAAN FIELD FRONTEND -> FIELD BACKEND (letter_type_fields) untuk SEMUA surat.

   Isian di form memakai key bahasa Inggris (fatherNik, brideBirthPlace, ...), sedangkan field backend
   diberi nama bahasa Indonesia oleh admin (nik_ayah, tempat_lahir_mempelai_wanita, ...). Pencocokan dilakukan
   berurutan di services/letter-create.service.js:
     1) OVERRIDE di bawah (paling kuat)  2) key persis / alias  3) kata-per-kata (file ini, urutan kata bebas).
   Kalau ada field yang belum cocok, buka halaman  /letter/mapping-check  (membandingkan SEMUA surat dengan
   backend), lalu isi override di sini. */

/* Override manual. "*" berlaku untuk semua surat; per-slug mengalahkan "*".
   Format: { "<slug>": { "<key di form>": "<field_key di backend>" } }
   Contoh:  "marriage-certificate-duplicate-letter": { destination: "tujuan" } */
export const FIELD_OVERRIDES = {
  "*": {},
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