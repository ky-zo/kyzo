export type BiomarkerCode = {
  name: string;
  category: string;
  unit: string | null;
  reference?: { low?: number; high?: number };
  /** % beyond range boundary before escalating status */
  threshold?: { borderline: number; abnormal: number };
};

export type Reading = {
  date: string;
  value: number | string;
  estimated?: boolean;
};

export const categories: Record<string, string> = {
  body: "body",
  haematology: "haematology",
  biochemistry: "biochemistry",
  immunology: "immunology",
  hormones: "hormones",
  performance: "performance",
};

export const codes: Record<string, BiomarkerCode> = {
  // --- body ---
  height: { name: "Height", category: "body", unit: "cm" },
  weight: { name: "Weight", category: "body", unit: "kg" },
  bmi: { name: "BMI", category: "body", unit: "kg/m\u00b2", reference: { low: 18.5, high: 24.9 }, threshold: { borderline: 8, abnormal: 20 } },
  body_fat_pct: { name: "Body Fat", category: "body", unit: "%", reference: { low: 8, high: 19 }, threshold: { borderline: 10, abnormal: 25 } },
  fat_mass: { name: "Fat Mass", category: "body", unit: "kg" },

  // --- haematology ---
  hb: { name: "Haemoglobin", category: "haematology", unit: "g/dL", reference: { low: 13.5, high: 17.5 }, threshold: { borderline: 7, abnormal: 15 } },
  hct: { name: "Haematocrit", category: "haematology", unit: "%", reference: { low: 38.3, high: 48.6 }, threshold: { borderline: 7, abnormal: 15 } },
  rbc: { name: "Red Blood Cell", category: "haematology", unit: "x10\u2076/mm\u00b3", reference: { low: 4.5, high: 5.5 }, threshold: { borderline: 7, abnormal: 15 } },
  rdw: { name: "RDW", category: "haematology", unit: "%", reference: { low: 11.5, high: 14.5 }, threshold: { borderline: 10, abnormal: 20 } },
  mcv: { name: "MCV", category: "haematology", unit: "fL", reference: { low: 80, high: 100 }, threshold: { borderline: 5, abnormal: 15 } },
  mch: { name: "MCH", category: "haematology", unit: "pg", reference: { low: 27, high: 33 }, threshold: { borderline: 7, abnormal: 15 } },
  mchc: { name: "MCHC", category: "haematology", unit: "g/dL", reference: { low: 32, high: 36 }, threshold: { borderline: 5, abnormal: 10 } },
  wbc: { name: "Total WBC", category: "haematology", unit: "x10\u00b3/mm\u00b3", reference: { low: 4.5, high: 11.0 }, threshold: { borderline: 10, abnormal: 25 } },
  eosinophils_pct: { name: "Eosinophils %", category: "haematology", unit: "%", reference: { low: 1, high: 4 }, threshold: { borderline: 25, abnormal: 50 } },
  eosinophils: { name: "Eosinophils", category: "haematology", unit: "/mm\u00b3", reference: { low: 100, high: 500 }, threshold: { borderline: 25, abnormal: 50 } },
  neutrophils_pct: { name: "Neutrophils %", category: "haematology", unit: "%", reference: { low: 40, high: 70 }, threshold: { borderline: 10, abnormal: 25 } },
  neutrophils: { name: "Neutrophils", category: "haematology", unit: "/mm\u00b3", reference: { low: 1800, high: 7700 }, threshold: { borderline: 10, abnormal: 25 } },
  lymphocytes_pct: { name: "Lymphocytes %", category: "haematology", unit: "%", reference: { low: 20, high: 40 }, threshold: { borderline: 10, abnormal: 25 } },
  lymphocytes: { name: "Lymphocytes", category: "haematology", unit: "/mm\u00b3", reference: { low: 1000, high: 4800 }, threshold: { borderline: 10, abnormal: 25 } },
  monocytes_pct: { name: "Monocytes %", category: "haematology", unit: "%", reference: { low: 2, high: 8 }, threshold: { borderline: 15, abnormal: 30 } },
  monocytes: { name: "Monocytes", category: "haematology", unit: "/mm\u00b3", reference: { low: 200, high: 800 }, threshold: { borderline: 15, abnormal: 30 } },
  basophils_pct: { name: "Basophils %", category: "haematology", unit: "%", reference: { low: 0, high: 1 }, threshold: { borderline: 25, abnormal: 50 } },
  basophils: { name: "Basophils", category: "haematology", unit: "/mm\u00b3", reference: { low: 0, high: 200 }, threshold: { borderline: 25, abnormal: 50 } },
  platelets: { name: "Platelet Count", category: "haematology", unit: "x10\u00b3/mm\u00b3", reference: { low: 150, high: 400 }, threshold: { borderline: 10, abnormal: 25 } },
  mpv: { name: "MPV", category: "haematology", unit: "fL", reference: { low: 7.5, high: 11.5 }, threshold: { borderline: 10, abnormal: 20 } },

  // --- biochemistry ---
  glucose_fasting: { name: "Glucose (Fasting)", category: "biochemistry", unit: "mg/dL", reference: { low: 70, high: 100 }, threshold: { borderline: 3, abnormal: 10 } },
  hba1c: { name: "Haemoglobin A1C", category: "biochemistry", unit: "%", reference: { high: 5.7 }, threshold: { borderline: 3, abnormal: 8 } },
  cholesterol_total: { name: "Cholesterol (Total)", category: "biochemistry", unit: "mg/dL", reference: { high: 200 }, threshold: { borderline: 5, abnormal: 20 } },
  hdl: { name: "HDL Cholesterol", category: "biochemistry", unit: "mg/dL", reference: { low: 40 }, threshold: { borderline: 10, abnormal: 25 } },
  ldl: { name: "LDL Cholesterol (Direct)", category: "biochemistry", unit: "mg/dL", reference: { high: 130 }, threshold: { borderline: 8, abnormal: 20 } },
  triglycerides: { name: "Triglyceride", category: "biochemistry", unit: "mg/dL", reference: { high: 150 }, threshold: { borderline: 10, abnormal: 30 } },
  bun: { name: "BUN", category: "biochemistry", unit: "mg/dL", reference: { low: 7, high: 20 }, threshold: { borderline: 10, abnormal: 25 } },
  creatinine: { name: "Creatinine", category: "biochemistry", unit: "mg/dL", reference: { low: 0.7, high: 1.3 }, threshold: { borderline: 5, abnormal: 15 } },
  egfr: { name: "eGFR", category: "biochemistry", unit: "mL/min/1.73m\u00b2", reference: { low: 60 }, threshold: { borderline: 10, abnormal: 25 } },
  uric_acid: { name: "Uric Acid", category: "biochemistry", unit: "mg/dL", reference: { low: 3.5, high: 7.2 }, threshold: { borderline: 7, abnormal: 20 } },
  alt: { name: "ALT (SGPT)", category: "biochemistry", unit: "U/L", reference: { low: 7, high: 56 }, threshold: { borderline: 10, abnormal: 50 } },
  ast: { name: "AST (SGOT)", category: "biochemistry", unit: "U/L", reference: { low: 10, high: 40 }, threshold: { borderline: 10, abnormal: 50 } },
  ggt: { name: "GGT", category: "biochemistry", unit: "U/L", reference: { low: 9, high: 48 }, threshold: { borderline: 10, abnormal: 50 } },
  alp: { name: "ALP", category: "biochemistry", unit: "U/L", reference: { low: 44, high: 147 }, threshold: { borderline: 10, abnormal: 25 } },
  total_protein: { name: "Total Protein", category: "biochemistry", unit: "g/dL", reference: { low: 6.0, high: 8.3 }, threshold: { borderline: 5, abnormal: 15 } },
  bilirubin_total: { name: "Bilirubin (Total)", category: "biochemistry", unit: "mg/dL", reference: { low: 0.1, high: 1.2 }, threshold: { borderline: 10, abnormal: 30 } },
  bilirubin_direct: { name: "Bilirubin (Direct)", category: "biochemistry", unit: "mg/dL", reference: { high: 0.3 }, threshold: { borderline: 10, abnormal: 30 } },
  albumin: { name: "Albumin", category: "biochemistry", unit: "g/dL", reference: { low: 3.5, high: 5.5 }, threshold: { borderline: 5, abnormal: 15 } },
  globulin: { name: "Globulin", category: "biochemistry", unit: "g/dL", reference: { low: 2.0, high: 3.5 }, threshold: { borderline: 10, abnormal: 25 } },
  ag_ratio: { name: "A/G Ratio", category: "biochemistry", unit: null, reference: { low: 1.1, high: 2.5 }, threshold: { borderline: 10, abnormal: 25 } },

  ferritin: { name: "Ferritin", category: "biochemistry", unit: "ng/mL", reference: { low: 30, high: 400 }, threshold: { borderline: 10, abnormal: 25 } },

  // --- immunology ---
  tsh: { name: "TSH", category: "immunology", unit: "uIU/mL", reference: { low: 0.4, high: 4.0 }, threshold: { borderline: 5, abnormal: 20 } },
  psa: { name: "PSA", category: "immunology", unit: "ng/mL", reference: { high: 4.0 }, threshold: { borderline: 10, abnormal: 25 } },
  cea: { name: "CEA", category: "immunology", unit: "ng/mL", reference: { high: 5.0 }, threshold: { borderline: 10, abnormal: 50 } },
  afp: { name: "AFP", category: "immunology", unit: "ng/mL", reference: { high: 8.3 }, threshold: { borderline: 15, abnormal: 50 } },

  // --- hormones ---
  testosterone: { name: "Testosterone", category: "hormones", unit: "ng/mL", reference: { low: 3.0, high: 10.0 }, threshold: { borderline: 10, abnormal: 25 } },
  free_testosterone: { name: "Free Testosterone", category: "hormones", unit: "pg/mL", reference: { low: 47, high: 244 }, threshold: { borderline: 10, abnormal: 25 } },
  shbg: { name: "SHBG", category: "hormones", unit: "nmol/L", reference: { low: 10, high: 57 }, threshold: { borderline: 10, abnormal: 25 } },
  estradiol: { name: "Estradiol", category: "hormones", unit: "pg/mL", reference: { low: 10, high: 40 }, threshold: { borderline: 15, abnormal: 30 } },
  lh: { name: "LH", category: "hormones", unit: "mIU/mL", reference: { low: 1.7, high: 8.6 }, threshold: { borderline: 10, abnormal: 25 } },
  fsh: { name: "FSH", category: "hormones", unit: "mIU/mL", reference: { low: 1.5, high: 12.4 }, threshold: { borderline: 10, abnormal: 25 } },
  prolactin: { name: "Prolactin", category: "hormones", unit: "ng/mL", reference: { low: 4.0, high: 15.2 }, threshold: { borderline: 10, abnormal: 30 } },
  free_t3: { name: "Free T3", category: "hormones", unit: "pg/mL", reference: { low: 2.0, high: 4.4 }, threshold: { borderline: 7, abnormal: 20 } },
  free_t4: { name: "Free T4", category: "hormones", unit: "ng/dL", reference: { low: 0.82, high: 1.77 }, threshold: { borderline: 7, abnormal: 20 } },

  // --- performance ---
  rhr: { name: "Resting Heart Rate", category: "performance", unit: "bpm", reference: { low: 40, high: 70 }, threshold: { borderline: 10, abnormal: 25 } },
  hrv: { name: "HRV", category: "performance", unit: "ms", reference: { low: 30, high: 50 }, threshold: { borderline: 15, abnormal: 30 } },
  vo2max: { name: "VO2 Max", category: "performance", unit: "mL/kg/min", reference: { low: 40, high: 60 }, threshold: { borderline: 10, abnormal: 25 } },
  pr_marathon: { name: "Marathon PR", category: "performance", unit: null },
  pr_half_marathon: { name: "Half Marathon PR", category: "performance", unit: null },
  pr_10k: { name: "10K PR", category: "performance", unit: null },
  pr_deadlift: { name: "Deadlift 1RM", category: "performance", unit: "kg" },
  pr_squat: { name: "Squat 1RM", category: "performance", unit: "kg" },
  pr_bench: { name: "Bench Press 1RM", category: "performance", unit: "kg" },
};

/** Each marker has its own array of readings, independent of any checkup */
export const readings: Record<string, Reading[]> = {
  height: [{ date: "2024-08-14", value: 179 }],
  weight: [{ date: "2024-08-14", value: 68.5 }, { date: "2025-07-29", value: 68.5 }],
  bmi: [{ date: "2024-08-14", value: 21.4 }, { date: "2025-07-29", value: 21.4 }],
  body_fat_pct: [{ date: "2025-07-29", value: 12.1 }, { date: "2026-04-03", value: 14, estimated: true }],
  fat_mass: [{ date: "2025-07-29", value: 8.3 }],
  hb: [{ date: "2024-08-14", value: 16.3 }],
  hct: [{ date: "2024-08-14", value: 46.1 }],
  rbc: [{ date: "2024-08-14", value: 5.32 }],
  rdw: [{ date: "2024-08-14", value: 11.2 }],
  mcv: [{ date: "2024-08-14", value: 86.7 }],
  mch: [{ date: "2024-08-14", value: 30.6 }],
  mchc: [{ date: "2024-08-14", value: 35.4 }],
  wbc: [{ date: "2024-08-14", value: 5.54 }],
  eosinophils_pct: [{ date: "2024-08-14", value: 2.7 }],
  eosinophils: [{ date: "2024-08-14", value: 150 }],
  neutrophils_pct: [{ date: "2024-08-14", value: 65.1 }],
  neutrophils: [{ date: "2024-08-14", value: 3607 }],
  lymphocytes_pct: [{ date: "2024-08-14", value: 26.5 }],
  lymphocytes: [{ date: "2024-08-14", value: 1468 }],
  monocytes_pct: [{ date: "2024-08-14", value: 5.2 }],
  monocytes: [{ date: "2024-08-14", value: 288 }],
  basophils_pct: [{ date: "2024-08-14", value: 0.5 }],
  basophils: [{ date: "2024-08-14", value: 28 }],
  platelets: [{ date: "2024-08-14", value: 230 }],
  mpv: [{ date: "2024-08-14", value: 10 }],
  glucose_fasting: [{ date: "2024-08-14", value: 99 }],
  hba1c: [{ date: "2024-08-14", value: 4.9 }],
  cholesterol_total: [{ date: "2024-08-14", value: 212 }],
  hdl: [{ date: "2024-08-14", value: 59 }],
  ldl: [{ date: "2024-08-14", value: 135 }],
  triglycerides: [{ date: "2024-08-14", value: 47 }],
  bun: [{ date: "2024-08-14", value: 14.4 }],
  creatinine: [{ date: "2024-08-14", value: 1.0 }],
  egfr: [{ date: "2024-08-14", value: 100.6 }],
  uric_acid: [{ date: "2024-08-14", value: 6.6 }],
  alt: [{ date: "2024-08-14", value: 14 }],
  ast: [{ date: "2024-08-14", value: 20 }],
  ggt: [{ date: "2024-08-14", value: 17 }],
  alp: [{ date: "2024-08-14", value: 81 }],
  total_protein: [{ date: "2024-08-14", value: 6.93 }],
  bilirubin_total: [{ date: "2024-08-14", value: 0.8 }],
  bilirubin_direct: [{ date: "2024-08-14", value: 0.3 }],
  albumin: [{ date: "2024-08-14", value: 4.85 }],
  globulin: [{ date: "2024-08-14", value: 2.08 }],
  ag_ratio: [{ date: "2024-08-14", value: 2.33 }],
  tsh: [{ date: "2024-08-14", value: 0.812 }],
  psa: [{ date: "2024-08-14", value: 0.148 }],
  cea: [{ date: "2024-08-14", value: 3.05 }],
  afp: [{ date: "2024-08-14", value: 0.45 }],
  testosterone: [{ date: "2024-08-14", value: 8.80 }],
  rhr: [{ date: "2026-04-03", value: 57 }],
  hrv: [{ date: "2026-04-03", value: 41 }],
  vo2max: [{ date: "2025-07-29", value: 60.2 }],
  pr_marathon: [{ date: "2025-12-07", value: "3:11:17" }],
  pr_half_marathon: [{ date: "2022-09-03", value: "1:32:03" }],
  pr_10k: [{ date: "2025-11-11", value: "39:29" }],
  pr_deadlift: [{ date: "2025-07-29", value: 116, estimated: true }],
  pr_squat: [{ date: "2025-07-29", value: 80, estimated: true }],
  pr_bench: [{ date: "2025-07-29", value: 58, estimated: true }],
};
