/* Kode letter_types backend untuk katalog surat admin.
   Kode tampilan lama tidak selalu sama dengan kode backend, jadi pemetaan
   berdasarkan slug harus menjadi satu-satunya sumber identitas API. */
export const BACKEND_CODE_BY_SLUG = {
  "divorce-lawsuit-letter": "SGC", "family-biodata": "FBWNI", "fuel-recommendation-letter": "SRBBM",
  "kia-application-form": "SPKIA", "ktp-application-form": "SPKTP", "population-occurrence-registration": "SPKIAF",
  "relocation-certificate-form": "SPPWF", "relocation-cover-letter": "SPPWNI", "resident-arrival-form": "SKDT",
  "temporary-resident-request": "SKTS", "temporary-stay-application-form": "SPTTS",
  "heir-power-of-attorney-letter": "SKWKA", "identity-discrepancy-statement-letter": "SPBNI",
  "population-document-statement-letter": "SPTMDK", "population-service-authorization-letter": "SKDPAK",
  "statement-population-data-change": "SPDP", "unregistered-marriage-responsibility-letter": "SPTJP",
  "bussiness-permit-letter": "SKU", "domicile-certificate": "SKD", "event-permit-letter": "SKK",
  "general-statement-letter": "SKUM", "income-permit-letter": "SKP", "legalization-register": "RL",
  "skck-referral-letter": "SKCK", "sktm-general": "SKTM", "sktm-school": "SKTMS",
  "travel-permit-letter-gov": "SKJG", "unmarried-status-letter": "SKBK",
  "bride-groom-consent-letter": "SPCCP", "death-certificate-for-marriage-letter": "SKKMP",
  "general-certificate-letter": "SKUMN", "marriage-application-letter": "SPNIK",
  "marriage-introduction-letter": "SPNIP", "marriage-lodging-certificate-letter": "SKTNB",
  "marriage-registration-data-sheet": "FPDN", "never-married-certificate-letter": "SKBKN",
  "not-remarried-statement-letter": "SPBML", "parental-consent-letter": "SPOT",
  "guardian-statement": "SKWNP", "health-referral": "SPTKP", "judge-guardian": "SKWHP",
  "marriage-lodging": "SKNNP", "n1": "N1P", "n2": "N2P", "n4": "N4P", "n5": "N5P", "n6": "N6P",
  "registration-form": "PNP", "unmarried-certificate": "SKBK2", "unmarried-statement": "SPBMLP",
  "birth-attestation-letter": "SKKL", "birth-certificate-application-form": "PAK",
  "birth-certificate-power-of-attorney": "SKAK", "birth-certificate-referral-letter": "SPAKL",
  "birth-registration-report": "LPKL", "birth-report-form": "FPK", "birth-report-statement": "LK",
  "late-birth-registration-approval-decree": "PPKT", "out-of-domicile-birth-report": "LKLD",
  "spousal-relationship-responsibility-statement": "SPTJMPSI", "death-certificate": "SKKM",
  "death-certificate-application": "DKA", "death-data-statement": "DKS", "death-general-statement": "DKU",
  "death-power-of-attorney": "DKP", "death-registration-report": "DKC", "death-report": "DKR",
  "death-report-form": "DKF", "land-origin-certificate-letter": "SKTA", "land-price-certificate-letter": "SKTH",
  "letter-c-data-statement-letter": "SPKLC", "power-of-attorney-letter": "SKC",
  "general-cover-letter": "SPU", "marriage-certificate-duplicate-letter": "SKDN",
  "duty-travel-order-letter": "SPPD", "permit-followup-letter": "SMLPI", "lease-offer-letter": "SPSKG",
  "research-response-letter": "SBP",
};

export const getBackendLetterCode = (slug, fallbackCode = "") =>
  BACKEND_CODE_BY_SLUG[String(slug ?? "")] ?? String(fallbackCode ?? "");
