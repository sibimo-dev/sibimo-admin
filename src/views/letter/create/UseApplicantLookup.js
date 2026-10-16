/* Pencarian pemohon lewat NIK di langkah pertama form Tambah Surat.
   `state` dipegang wizard (bukan komponennya) supaya hasil pencarian tidak hilang saat pindah langkah.
   `search(sections, form, autoFilled)` mengisi semua isian yang punya `from` dari data warga. */
import { reactive } from "vue";
import { findResidentByNik } from "@/services/resident-lookup.service";
import { applyResident } from "./formLogic";

export function useApplicantLookup() {
  const state = reactive({
    nik: "",
    status: "idle", // idle | loading | found | notfound | invalid | error
    name: "",
    filled: 0,
    message: "",
    resident: null, // data warga hasil pencarian (cadangan identitas pemohon saat form surat tidak punya isian nama/NIK/alamat)
  });

  async function search(sections, form, autoFilled = {}) {
    if (state.status === "loading") return;
    const nik = state.nik.replace(/\D/g, "");
    if (nik.length !== 16) {
      Object.assign(state, { status: "invalid", message: "NIK harus 16 digit angka." });
      return;
    }
    state.status = "loading";
    try {
      const resident = await findResidentByNik(nik);
      // Tidak ditemukan: NIK yang diketik tetap disalin ke isian NIK supaya tidak perlu mengetik ulang.
      const filled = applyResident(form, sections, resident ?? { nik }, autoFilled);
      Object.assign(state, resident ? { status: "found", name: resident.fullName, filled: filled.length, message: "", resident } : { status: "notfound", name: "", filled: 0, message: "", resident: null });
    } catch (err) {
      Object.assign(state, { status: "error", message: err?.response?.data?.message || "Gagal mencari data warga. Isi manual atau coba lagi." });
    }
  }

  /* Lengkapi data pemohon untuk payload simpan. Isian form SELALU menang; hanya yang kosong diisi dari hasil
     pencarian NIK (atau NIK yang diketik di kotak pencarian). Ini menutup surat yang tidak punya isian
     name/nik/address standar (mis. surat dengan applicantName, ownerName, atau tanpa kolom alamat). */
  function withApplicant(applicant = {}) {
    const r = state.resident || {};
    const digits = String(state.nik || "").replace(/\D/g, "");
    const pick = (v, fb) => (String(v ?? "").trim() ? String(v).trim() : String(fb ?? "").trim());
    const nikOk = (v) => String(v ?? "").replace(/\D/g, "").length === 16;
    return {
      ...applicant,
      name: pick(applicant.name, r.fullName),
      nik: nikOk(applicant.nik) ? String(applicant.nik).trim() : (nikOk(r.nik) ? r.nik : (digits.length === 16 ? digits : String(applicant.nik ?? "").trim())),
      address: pick(applicant.address, r.address),
      phone: pick(applicant.phone, r.phoneNumber),
    };
  }

  return { state, search, withApplicant };
}