/* Pengiriman form Tambah Surat (admin).
   TODO(BE): sementara MOCK. Ganti isi fungsi di bawah dengan request ke backend saat endpoint-nya sudah siap
   (kirim `fields` + `files`; backend yang membuat kode/ID pengajuan dan men-generate PDF dari template tiap surat).
   Form di tampilan tidak perlu diubah: cukup ganti dua fungsi ini. */

const SOURCE = "Manual (Kelurahan)"; // sama dengan nilai `source` yang dipakai tambah surat sebelumnya

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};
const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* payload: { source, code, title, fields, files: [{ label, file }] } → { code } */
export async function submitSingleLetter(payload) {
  await wait(800);
  return { code: `${payload.code}-${stamp()}-${rand()}` };
}

/* payload: { source, bundle, letters: [{ id, code, title, fields, files }] } → { codes: [{ title, code }] } */
export async function submitLetterBundle(payload) {
  await wait(900);
  return { codes: payload.letters.map((l) => ({ title: l.title, code: `${l.code}-${stamp()}-${rand()}` })) };
}

export { SOURCE as LETTER_SOURCE };
