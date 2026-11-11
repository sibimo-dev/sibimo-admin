// Permohonan Kehendak Nikah
import { DOC, akad, calonPengantin, pemohonRingkas } from "@/data/letterFields";

const penandatanganKua = () => ({
  title: "Penandatangan KUA (opsional)",
  fields: [
    {
      key: "kua_head_name",
      label: "Nama Kepala KUA / Penghulu",
      type: "text",
      required: false,
      placeholder: "Boleh dikosongkan",
    },
  ],
});

export const sections = [
  { ...pemohonRingkas(), title: "Data Catin Pria" },
  { ...calonPengantin(), title: "Data Catin Pria dan Catin Wanita" },
  akad(),
  penandatanganKua(),
];

export const documents = [DOC.ktp, DOC.kk, "Fotokopi KTP calon pasangan", DOC.pasFoto, DOC.aktaLahir, "Surat keterangan wali nikah"];

export const meta = {"title": "Permohonan Kehendak Nikah", "code": "KHN"};