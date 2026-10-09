/* Helper kecil untuk pratinjau file unggahan (tanpa tampilan). */
export const isPdf = (f) => f?.type === "application/pdf" || /\.pdf$/i.test(f?.name ?? "");
// HEIC/HEIF tidak bisa ditampilkan browser → tidak dipratinjau sebagai gambar
export const canPreviewImage = (f) => !!f && /^image\//.test(f.type) && !/hei[cf]/i.test(f.type);
export const canPreview = (f) => canPreviewImage(f) || isPdf(f);
