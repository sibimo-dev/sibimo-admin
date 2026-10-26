// Disalin dari public: views/services/letters/married-man/bride-groom-consent-letter.vue (hanya bagian isian & dokumen).
// Isian di sini harus tetap sama dengan di public. Tampilan wizard ada di views/letter/create/.
// Persetujuan Calon Pengantin
import { DOC, N7, calonIstri, calonSuami } from "@/data/letterFields";

export const sections = [{ ...calonSuami(N7), title: "Data Catin Pria" }, { ...calonIstri(N7), title: "Data Catin Wanita" }];

export const documents = ["Fotokopi KTP calon suami", "Fotokopi KTP calon istri", DOC.kk];

export const meta = {"title": "Persetujuan Calon Pengantin", "code": "SCM"};
