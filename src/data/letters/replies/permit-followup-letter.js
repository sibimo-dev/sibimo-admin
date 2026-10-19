// Surat Tindak Lanjut Permohonan Izin (jenis Balasan, surat internal kantor kalurahan).
// Template PDF: letters/replies/permit-followup-letter.blade.php  (backend SMLPI)
// Key mengikuti variabel blade:
//   $recipient              → recipientName      (Yth.; boleh banyak baris, tidak dibatasi; tiap baris dicetak di bawah "Yth :")
//   $recipient_address      → recipientAddress   (baris "Di")
//   $ref_number             → refLetterNumber    (nomor surat saudara yang ditindaklanjuti)
//   $event['date']          → eventDate          (tanggal mulai; $event['day_name'] dihitung otomatis)
//   $event['end_date']      → eventEndDate       (opsional; bila diisi dicetak rentang, mis. "27 – 29 Agustus 2026")
//   $event['time']          → eventTime          (waktu mulai)
//   $event['end_time']      → eventEndTime       (opsional; teks bebas, mis. "18.00 WIB" atau "Selesai" → dicetak "… s/d …")
//   $event['objective']     → eventObjective     (baris "Acara")
//   $event['place']         → eventPlace
//   $tembusan_1..10         → carbonCopies[i].name (tembusan per poin, bisa ditambah, maksimal 10; blade mengisi sesuai nomor poin)
// Key acara sama dengan surat keterangan keramaian (event-permit-letter). Nomor surat & penandatangan diisi sistem.
import { f, DOC } from "@/data/letterFields";

export const sections = [
  {
    title: "Tujuan Surat (Yth.)",
    hint: "Kolom Yth. bisa diisi beberapa baris: tekan Enter untuk baris baru (jabatan, instansi, pangkalan, dst.). Jumlah baris tidak dibatasi; tiap baris dicetak di bawah \"Yth :\".",
    fields: [
      f.area("recipientName", "Yth.", {
        span: 2,
        placeholder: "Contoh:\nKetua Panitia\nGerakan Pramuka Gugus Depan 17.063 – 17.064\nPangkalan SMPIT Baitussalam 2 Cangkringan",
      }),
      f.text("recipientAddress", "Di", { span: 2, optional: true, placeholder: "Contoh: Cangkringan" }),
    ],
  },
  {
    title: "Surat yang Ditindaklanjuti",
    fields: [
      f.text("refLetterNumber", "Nomor surat saudara", { span: 2, optional: true, placeholder: "Kosongkan bila ditulis tangan" }),
    ],
  },
  {
    title: "Kegiatan/Acara",
    hint: "Hari dicetak otomatis dari tanggal. Tanggal selesai dan waktu selesai opsional: isi bila kegiatan berlangsung beberapa hari atau ada jam selesai (kosongkan bila hanya satu hari/satu waktu).",
    fields: [
      f.date("eventDate", "Tanggal mulai"),
      f.date("eventEndDate", "Tanggal selesai (opsional)", { optional: true }),
      f.time("eventTime", "Waktu mulai"),
      f.text("eventEndTime", "Waktu selesai (opsional)", { optional: true, placeholder: "Contoh: 18.00 WIB, atau ketik: Selesai" }),
      f.area("eventObjective", "Acara", { span: 2 }),
      f.text("eventPlace", "Tempat", { span: 2 }),
    ],
  },
  {
    title: "Tembusan",
    hint: "Tambah poin dengan tombol tambah baris (maksimal 10). Tiap poin dicetak bernomor sesuai urutan; kosongkan bila tidak ada tembusan.",
    fields: [
      f.rows("carbonCopies", "Daftar tembusan", [{ key: "name", label: "Tujuan tembusan" }], { max: 10, optional: true }),
    ],
  },
];

export const documents = ["Surat permohonan izin dari pemohon", DOC.ktp];

export const meta = { title: "Surat Tindak Lanjut Permohonan Izin", code: "TLP" };
