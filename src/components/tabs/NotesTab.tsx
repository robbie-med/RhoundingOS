import React, { useState, useMemo } from "react";
import { Patient, Medication, Problem } from "../../types";
import { 
  Copy, 
  Trash2, 
  Plus, 
  Menu, 
  ChevronRight, 
  Search, 
  MoreVertical,
  Stethoscope,
  Pill,
  Activity,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  X,
  AlertTriangle,
  Info,
  ShieldCheck
} from "lucide-react";
import { usePatients } from "../../context/PatientContext";
import { v4 as uuidv4 } from "uuid";
import { runSafetyChecks, SafetyAlert } from "../../services/SafetyService";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// TEMPLATES
const PROBLEM_TEMPLATES = [
  { 
    system: "Cardiovascular",
    title: "Acute Heart Failure Exacerbation", 
    assessment: "Acute decompensated heart failure with volume overload, likely secondary to [non-compliance/ischemia/dietary indiscretion]. Clinical signs of pulmonary congestion and peripheral edema present. Goal is diuresis to dry weight and optimization of GDMT.",
    ddx: ["Ischemic Cardiomyopathy", "Hypertensive Emergency", "Valvular Heart Disease (MR/AR)", "Flash Pulmonary Edema", "Pneumonia"],
    medications: [
      { name: "Furosemide", dose: "40mg (or 2x home dose)", frequency: "BID" },
      { name: "Lisinopril", dose: "10mg", frequency: "QD" },
      { name: "Metoprolol Succinate", dose: "25mg", frequency: "QD" },
      { name: "Spironolactone", dose: "25mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Cardiovascular",
    title: "Atrial Fibrillation with RVR", 
    assessment: "New onset vs recurrence of AFib with rapid ventricular response. Hemodynamically [stable/unstable]. CHADS-VASc score calculated as [X]. Goal is rate control < 110 bpm and evaluation for anticoagulation.",
    ddx: ["Thyrotoxicosis", "Pulmonary Embolism", "Sympathetic Surge", "Electrolyte abnormality (K/Mg)", "Alcohol (Holiday Heart)"],
    medications: [
      { name: "Metoprolol Tartrate", dose: "25mg", frequency: "TID" },
      { name: "Diltiazem GTT", dose: "Titrate", frequency: "PRN" },
      { name: "Apixaban", dose: "5mg", frequency: "BID" },
      { name: "Magnesium Sulfate", dose: "2g", frequency: "PRN" }
    ] 
  },
  { 
    system: "Cardiovascular",
    title: "Atrial Fibrillation (Chronic/STABLE)", 
    assessment: "Chronic Atrial Fibrillation, stable on current hospital regimen. Rate controlled < 110 bpm. Patient is [high/low] risk for thromboembolism per CHADS-VASc. Continuing home rate control and anticoagulation.",
    ddx: ["Decompensated Heart Failure", "Valvular Disease", "Hyperthyroidism", "Post-operative state"],
    medications: [
      { name: "Metoprolol Succinate", dose: "25mg", frequency: "QD" },
      { name: "Apixaban", dose: "5mg", frequency: "BID" }
    ] 
  },
  { 
    system: "Cardiovascular",
    title: "Hypertensive Urgency", 
    assessment: "Asymptomatic severe hypertension (SBP > 180 or DBP > 120) without evidence of acute end-organ damage. Goal is gradual reduction of MAP by 25% over 24-48 hours.",
    ddx: ["Pain-induced HTN", "Anxiety", "Medication Non-compliance/Recoil", "Obstructive Sleep Apnea exacerbation", "Renovascular HTN"],
    medications: [
      { name: "Amlodipine", dose: "5mg", frequency: "QD" },
      { name: "Hydralazine", dose: "25mg", frequency: "PRN" },
      { name: "Labetalol", dose: "100mg", frequency: "BID" },
      { name: "Clonidine", dose: "0.1mg", frequency: "PRN" }
    ] 
  },
  { 
    system: "Cardiovascular",
    title: "Syncope / Orthostasis", 
    assessment: "Loss of consciousness, likely [Vasovagal vs Orthostatic vs Cardiac]. Workup tailored to identify underlying arrhythmogenic or structural cardiac causes vs neurogenic triggers.",
    ddx: ["Arrhythmia (HB/SVT)", "Aortic Stenosis", "Orthostatic Hypotension", "Seizure (Post-ictal)", "Pulmonary Embolism"],
    medications: [
      { name: "Midodrine", dose: "5mg", frequency: "TID" },
      { name: "Normal Saline Bolus", dose: "1L", frequency: "PRN" },
      { name: "Fludrocortisone", dose: "0.1mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Pulmonary",
    title: "COPD Exacerbation", 
    assessment: "Acute-on-chronic respiratory failure secondary to COPD exacerbation, Anthonisen Type I (increased dyspnea/sputum volume/purulence). Trigger likely [viral vs bacterial vs environmental]. Monitoring for need for BIPAP.",
    ddx: ["Pneumonia", "Pulmonary Embolism", "Acute Heart Failure", "Pneumothorax", "Myocardial Infarction"],
    medications: [
      { name: "Albuterol/Ipratropium", dose: "2.5/0.5mg", frequency: "Q4H" },
      { name: "Prednisone", dose: "40mg", frequency: "QD" },
      { name: "Azithromycin", dose: "500mg", frequency: "QD" },
      { name: "Nicotine Patch", dose: "21mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Pulmonary",
    title: "Pneumonia (CAP)", 
    assessment: "Community-acquired pneumonia, CURB-65 score: [X]. Clinical picture consistent with [lobar/interstitial] infiltration. Plan for targeted antimicrobial therapy after cultures.",
    ddx: ["Viral Pneumonitis", "Heart Failure (Pulmonary Edema)", "Aspiration Pneumonitis", "Lung Malignancy", "Pulmonary Infarction"],
    medications: [
      { name: "Ceftriaxone", dose: "1g", frequency: "QD" },
      { name: "Azithromycin", dose: "500mg", frequency: "QD" },
      { name: "Guaifenesin", dose: "600mg", frequency: "BID" }
    ] 
  },
  { 
    system: "Pulmonary",
    title: "Pulmonary Embolism", 
    assessment: "Confirmed acute PE on CTPE. PESI score [X] indicating [Low/High] risk. Patient is hemodynamically stable. Anticoagulation initiated to prevent further thrombotic events.",
    ddx: ["ACS (NSTEMI)", "Pneumothorax", "Pleuritic Chest Pain", "Pneumonia", "Rib Fracture"],
    medications: [
      { name: "Heparin GTT", dose: "Protocol", frequency: "QD" },
      { name: "Enoxaparin", dose: "1mg/kg", frequency: "BID" },
      { name: "Rivaroxaban", dose: "15mg", frequency: "BID" },
      { name: "Apixaban", dose: "10mg (load)", frequency: "BID" }
    ] 
  },
  { 
    system: "Pulmonary",
    title: "COPD (Chronic/STABLE)", 
    assessment: "Chronic obstructive pulmonary disease, baseline status. No evidence of acute exacerbation (no increased dyspnea or purulent sputum). Continuing baseline inhaler therapy and monitoring respiratory effort.",
    ddx: ["Acute COPD Exacerbation", "Pneumonia", "CHF", "Baseline Deconditioning"],
    medications: [
      { name: "Tiotropium", dose: "18mcg", frequency: "QD" },
      { name: "Salmeterol/Fluticasone", dose: "250/50mcg", frequency: "BID" },
      { name: "Albuterol HFA", dose: "2 puffs Q4H", frequency: "PRN" }
    ] 
  },
  { 
    system: "Renal/Lytes",
    title: "Acute Kidney Injury", 
    assessment: "Acute kidney injury (Stage [X]) based on Cr elevation from baseline [X] to [Y]. Etiology likely [Prerenal (dehydration/diuretics) vs ATN vs Postrenal (obstruction)]. Monitoring urinary output and electrolytes.",
    ddx: ["Hypovolemia/Dehydration", "Acute Tubular Necrosis (ATN)", "Nephrotoxin exposure (NSAIDs/Contrast)", "Obstructive Uropathy", "Glomerulonephritis"],
    medications: [
      { name: "Normal Saline", dose: "75cc/hr", frequency: "QD" },
      { name: "Furosemide", dose: "HOLD", frequency: "PRN" },
      { name: "Lisinopril", dose: "HOLD", frequency: "PRN" }
    ] 
  },
  { 
    system: "Renal/Lytes",
    title: "Hyponatremia", 
    assessment: "Total body sodium vs water excess mismatch. Likely [SIADH vs Hypovolemic vs Dilutional]. Goal is safe correction of Na by < 6-8 mEq/24h to avoid Osmotic Demyelination Syndrome (ODS).",
    ddx: ["SIADH", "Hypovolemic Hyponatremia (Dehydration)", "Heart Failure (Dilutional)", "Adrenal Insufficiency", "Psychogenic Polydipsia"],
    medications: [
      { name: "Sodium Chloride (Tabs)", dose: "1g", frequency: "TID" },
      { name: "3% Saline", dose: "50cc/hr (if symptomatic)", frequency: "PRN" },
      { name: "Furosemide", dose: "20mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Renal/Lytes",
    title: "Hyperkalemia", 
    assessment: "Serum Potassium > 5.5 mEq/L with [present/absent] ECG changes. Plan for immediate membrane stabilization with calcium, shifting with insulin/D50, and eventual removal/excretion.",
    ddx: ["AKI / Stage V CKD", "Medication-induced (ACEi/ARB/Spironolactone)", "Rhabdomyolysis", "Lab Hemolysis (Pseudohyperkalemia)", "Metabolic Acidosis"],
    medications: [
      { name: "Calcium Gluconate", dose: "1g", frequency: "PRN" },
      { name: "Insulin Regular", dose: "10 units (+ D50W)", frequency: "PRN" },
      { name: "Albuterol (Nebulized)", dose: "10-20mg", frequency: "PRN" },
      { name: "Sodium Zirconium (Lokelma)", dose: "10g", frequency: "TID" }
    ] 
  },
  { 
    system: "Renal/Lytes",
    title: "Hypercalcemia", 
    assessment: "Corrected Calcium > 10.5 mg/dL. Likely [Malignancy vs Hyperparathyroidism]. Goal is aggressive volume expansion and inhibition of bone resorption.",
    ddx: ["Malignancy (PTHrP / Bone mets)", "Primary Hyperparathyroidism", "Vitamin D Toxicity", "Sarcoidosis / Granulomatous Disease", "Thiazide usage"],
    medications: [
      { name: "Normal Saline", dose: "250cc/hr", frequency: "QD" },
      { name: "Zoledronic Acid", dose: "4mg", frequency: "Once" },
      { name: "Calcitonin", dose: "4 units/kg", frequency: "Q12H" }
    ] 
  },
  { 
    system: "Infectious Disease",
    title: "Sepsis / Septic Shock", 
    assessment: "Sepsis secondary to suspected [pulmonary/urinary/biliary] source. qSOFA/SIRS positive. Hemodynamics: [Stable/Fluctuating]. Initiating Surviving Sepsis Bundle including aggressive fluid resuscitation and broad-spectrum antibiotics.",
    ddx: ["Pneumonia", "Pyelonephritis", "Cholecystitis/Cholangitis", "Meningitis", "Bacteremia (CLABSI/CAUTI)"],
    medications: [
      { name: "Vancomycin", dose: "15mg/kg", frequency: "Q12H" },
      { name: "Piperacillin/Tazobactam", dose: "3.375g", frequency: "Q8H" },
      { name: "Norepinephrine", dose: "Titrate to MAP > 65", frequency: "PRN" },
      { name: "Normal Saline (30cc/kg)", dose: "Bolus", frequency: "PRN" }
    ] 
  },
  { 
    system: "Infectious Disease",
    title: "Cellulitis / Soft Tissue Infection", 
    assessment: "Cellulitis involving the [extremity/area]. Increasing erythema, warmth, and tenderness. Monitoring for systemic signs (SIRS) and potential for deeper space infection/abscess.",
    ddx: ["DVT", "Venous Stasis Dermatitis", "Lymphedema", "Necrotizing Fasciitis", "Contact Dermatitis"],
    medications: [
      { name: "Cefazolin", dose: "1g", frequency: "Q8H" },
      { name: "Vancomycin", dose: "15mg/kg", frequency: "Q12H" },
      { name: "Bactrim DS", dose: "1 tab", frequency: "BID" },
      { name: "Acetaminophen", dose: "650mg", frequency: "PRN" }
    ] 
  },
  { 
    system: "Infectious Disease",
    title: "Urosepsis / UTI (Complicated)", 
    assessment: "Systemic infection with urinary source (Leukocyte Esterase/Nitrite positive). Patient meets [SIRS/qSOFA] criteria. Initiating targeted antimicrobial therapy based on culture data.",
    ddx: ["Simple Cystitis", "Pyelonephritis", "Prostatitis", "Nephrolithiasis", "Pelvic Inflammatory Disease"],
    medications: [
      { name: "Ceftriaxone", dose: "1g", frequency: "QD" },
      { name: "Ciprofloxacin", dose: "400mg", frequency: "Q12H" },
      { name: "Phenazopyridine", dose: "200mg", frequency: "PRN" }
    ] 
  },
  { 
    system: "Infectious Disease",
    title: "Dog Bite / Mammalian Bite", 
    assessment: "Bite wound to the [LEFT/RIGHT BODY PART] sustained on [Date]. Evidence of [erythema/purulence/cellulitis]. Plan for antibiotic prophylaxis vs treatment and assessment of rabies/tetanus status.",
    ddx: ["Pasteurella multocida infection", "Capnocytophaga canimorsus (if immunocompromised)", "Staph/Strep Cellulitis", "Abscess Formation"],
    medications: [
      { name: "Amoxicillin-Clavulanate (Augmentin)", dose: "875-125mg", frequency: "BID" },
      { name: "Tetanus Toxoid (Tdap)", dose: "0.5mL", frequency: "Once" },
      { name: "Rabies Post-Exposure Prophylaxis", dose: "Protocol", frequency: "PRN" }
    ] 
  },
  { 
    system: "Gastroenterology",
    title: "GI Bleed (Upper)", 
    assessment: "Acute upper GI bleed suspect based on melena/hematemesis and drop in Hgb. Hemodynamically [stable/unstable]. Plan for NPO, resuscitation, and GI consultation for EGD.",
    ddx: ["Peptic Ulcer Disease", "Esophageal Varices", "Mallory-Weiss Tear", "Gastritis/Duodenitis", "Dieulafoy Lesion"],
    medications: [
      { name: "Pantoprazole", dose: "40mg", frequency: "BID" },
      { name: "Octreotide GTT", dose: "50mcg/hr", frequency: "PRN" },
      { name: "Ceftriaxone", dose: "1g (if Cirrhosis)", frequency: "QD" },
      { name: "Erythromycin", dose: "250mg (Pre-EGD)", frequency: "PRN" }
    ] 
  },
  { 
    system: "Gastroenterology",
    title: "Liver Cirrhosis / Hepatic Encephalopathy", 
    assessment: "Decompensated cirrhosis (Child-Pugh [X]) with evidence of [ascites/encephalopathy/varices]. Monitoring for Spontaneous Bacterial Peritonitis (SBP) and optimizing ammonia clearance.",
    ddx: ["Alcoholic Cirrhosis", "Nonalcoholic Steatohepatitis (NASH)", "Chronic Hepatitis C", "Autoimmune Hepatitis", "Hemochromatosis"],
    medications: [
      { name: "Lactulose", dose: "30g (Goal 2-3 stools)", frequency: "TID" },
      { name: "Rifaximin", dose: "550mg", frequency: "BID" },
      { name: "Spironolactone", dose: "100mg (10:4 ratio)", frequency: "QD" },
      { name: "Furosemide", dose: "40mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Gastroenterology",
    title: "Acute Pancreatitis", 
    assessment: "Acute epigastric pain with Lipase > 3x normal. Likely secondary to [Gallstones vs Alcohol vs Hypertriglyceridemia]. Goal is aggressive fluid resuscitation and pain management.",
    ddx: ["Choledocholithiasis", "Peptic Ulcer Perforation", "Mesenteric Ischemia", "Small Bowel Obstruction"],
    medications: [
      { name: "Lactated Ringers", dose: "250cc/hr", frequency: "QD" },
      { name: "Hydromorphone", dose: "0.5mg", frequency: "PRN" },
      { name: "Ondansetron", dose: "4mg", frequency: "PRN" }
    ] 
  },
  { 
    system: "Gastroenterology",
    title: "Small Bowel Obstruction (SBO)", 
    assessment: "Obstipation, vomiting, and abdominal distension with CT showing transition point. Likely [Adhesions vs Hernia vs Malignancy]. Trial of conservative management with NPO + NGT.",
    ddx: ["Post-operative Ileus", "Large Bowel Obstruction", "Ogilvie's Syndrome", "Severe Constipation / Impaction"],
    medications: [
      { name: "Normal Saline", dose: "100cc/hr", frequency: "QD" },
      { name: "Promethazine", dose: "12.5mg", frequency: "PRN" },
      { name: "Glycerin Suppository", dose: "1", frequency: "PRN" }
    ] 
  },
  { 
    system: "Neurology",
    title: "Acute Ischemic Stroke", 
    assessment: "Focal neurologic deficit with NIHSS score [X]. Plan for permissive hypertension, secondary prevention, and frequent neuro-checks. Permissive BP goal < 220/120 (unless TPA given).",
    ddx: ["Intracranial Hemorrhage", "Todd's Paralysis (Post-ictal)", "Hypoglycemia", "Complex Migraine", "Conversion Disorder"],
    medications: [
      { name: "Aspirin", dose: "325mg", frequency: "QD" },
      { name: "Atorvastatin", dose: "80mg", frequency: "QD" },
      { name: "Clopidogrel", dose: "75mg", frequency: "QD" },
      { name: "Heparin", dose: "5000 units (VTE Pro-op)", frequency: "TID" }
    ] 
  },
  { 
    system: "Neurology",
    title: "Encephalopathy / Delirium", 
    assessment: "Acute change in mental status. Disturbance in attention and awareness. Etiology likely metabolic/infectious. Minimizing sedatives and optimizing sleep-wake cycles.",
    ddx: ["UTI/Urosepsis", "Hepatic Encephalopathy", "Hyponatremia", "Polypharmacy/Sedative use", "Stroke (Non-convulsive status)"],
    medications: [
      { name: "Lactulose", dose: "30g", frequency: "TID" },
      { name: "Melatonin", dose: "3mg", frequency: "QHS" },
      { name: "Quetiapine", dose: "12.5mg (low dose PRN)", frequency: "PRN" },
      { name: "Thiamine", dose: "100mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Neurology",
    title: "Seizure / Status Epilepticus", 
    assessment: "Episodes of loss of consciousness with [tonic-clonic] movements. Plan for evaluation of provoked causes (electrolytes/tox) vs new-onset epilepsy. EEG/MRI pending.",
    ddx: ["Metabolic Derangement (Hypoglycemia/Hyponatremia)", "Drug or Alcohol Withdrawal", "Intracranial Lesion / Malignancy", "Psychogenic Non-Epileptic Seizures (PNES)"],
    medications: [
      { name: "Levetiracetam (Keppra)", dose: "500mg", frequency: "BID" },
      { name: "Lorazepam", dose: "2-4mg (for active sz)", frequency: "PRN" },
      { name: "Thiamine", dose: "100mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Endocrine",
    title: "Diabetic Ketoacidosis (DKA)", 
    assessment: "Aged/New DM patient with metabolic acidosis, hyperglycemia, and positive ketones. Anion gap = [X]. Initiating DKA protocol with insulin drip and aggressive fluid/potassium management.",
    ddx: ["HHS", "Starvation Ketosis", "Alcoholic Ketoacidosis", "Salicylate Toxicity", "Uremia"],
    medications: [
      { name: "Insulin Regular Infusion", dose: "0.1u/kg/hr", frequency: "QD" },
      { name: "Normal Saline (1L/hr initial)", dose: "500cc/hr", frequency: "QD" },
      { name: "Potassium Chloride", dose: "20mEq (added to fluids)", frequency: "PRN" },
      { name: "D5NS (when Glucose < 250)", dose: "150cc/hr", frequency: "PRN" }
    ] 
  },
  { 
    system: "Hematology",
    title: "Anemia (Acute / Symptomatic)", 
    assessment: "[Normocytic/Microcytic] anemia with symptomatic [tachycardia/dyspnea]. Hgb drop from baseline [X] to [Y]. Plan for Source localization and support with transfusion if < 7g/dL.",
    ddx: ["Upper/Lower GI Bleed", "Iron Deficiency", "Anemia of Chronic Disease", "Source-less Hemolysis", "Vitamin B12 Deficiency"],
    medications: [
      { name: "Ferrous Sulfate", dose: "325mg", frequency: "QD" },
      { name: "Vitamin B12", dose: "1000mcg", frequency: "QD" },
      { name: "Folic Acid", dose: "1mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Hematology",
    title: "Deep Vein Thrombosis (DVT)", 
    assessment: "Unilateral lower extremity [Pain/Swelling] confirmed by Duplex Ultrasound. Wells Score: [X]. Initiation of therapeutic anticoagulation to prevent PE progression.",
    ddx: ["Cellulitis", "Baker's Cyst Rupture", "Chronic Venous Insufficiency", "Muscle Strain/Tear"],
    medications: [
      { name: "Enoxaparin", dose: "1mg/kg", frequency: "BID" },
      { name: "Apixaban", dose: "10mg load", frequency: "BID" },
      { name: "Rivaroxaban", dose: "15mg load", frequency: "BID" }
    ] 
  },
  { 
    system: "Rheumatology",
    title: "Gout / Pseudogout (Acute Flare)", 
    assessment: "Monoarthritis of [Joint] with intense erythema and swelling. Clinical presentation consistent with crystal-induced arthropathy. Plan for anti-inflammatory therapy.",
    ddx: ["Septic Arthritis", "Cellulitis", "Traumatic Hemarthrosis", "Rheumatoid Arthritis flair"],
    medications: [
      { name: "Naproxen", dose: "500mg", frequency: "BID" },
      { name: "Colchicine", dose: "0.6mg", frequency: "QD" },
      { name: "Prednisone", dose: "40mg", frequency: "QD" }
    ] 
  },
  { 
    system: "Behavioral/Tox",
    title: "Alcohol Withdrawal (CIWA)", 
    assessment: "Patient at high risk for alcohol withdrawal syndrome. Monitoring clinical status via CIWA-Ar protocol. Plan for symptom-triggered benzodiazepine administration and electrolyte/vitamin replacement.",
    ddx: ["Sepsis", "Wernicke's Encephalopathy", "Metabolic Derangement", "Benzodiazepine Withdrawal", "Stroke/TIA"],
    medications: [
      { name: "Lorazepam", dose: "2mg", frequency: "PRN" },
      { name: "Diazepam", dose: "10mg (if severe)", frequency: "PRN" },
      { name: "Thiamine", dose: "100mg", frequency: "QD" },
      { name: "Folic Acid", dose: "1mg", frequency: "QD" },
      { name: "Chlordiazepoxide", dose: "50mg", frequency: "Q6H" }
    ] 
  },
];

const MISC_OPTIONS = {
  o2: ["ORA", "2L NC", "4L NC", "6L NC", "NRB", "BIPAP", "Intubated"],
  codeStatus: ["Full Code", "DNI", "DNR", "DNI/DNR", "CMO"],
  giPpx: ["Per Primary", "Pantoprazole 40mg PO QD", "Famotidine 20mg PO BID", "None"],
  bowelPpx: ["Per Primary", "Senna/Colace", "Miralax", "Bisacodyl", "PEG", "None"],
  dvtPpx: ["Per Primary", "Enoxaparin 40mg SQ QD", "Enoxaparin 40mg SQ BID", "Heparin 5000 units SQ TID", "Heparin 5000 units SQ BID", "SCDs only", "None"],
  dispo: ["Per Primary", "Home", "SNF", "SAR", "Acute Rehab", "LTAC", "Hospice"],
  diet: ["NPO", "Clear Liquids", "Full Liquids", "Cardiac/Low Sodium", "Renal", "Regular", "Diabetic"]
};

// MISC SECTION COMPONENT
function MiscSection({ patient }: { patient: Patient }) {
  const { updatePatient } = usePatients();
  const misc = patient.misc || {
    o2: "",
    codeStatus: "",
    giPpx: "",
    bowelPpx: "",
    dvtPpx: "",
    dispo: "",
    dpoa: "",
    diet: ""
  };

  const updateMisc = (key: keyof typeof misc, value: string) => {
    updatePatient(patient.id, { 
      misc: { ...misc, [key]: value } 
    });
  };

  const categories = [
    { label: "O2", key: "o2", options: MISC_OPTIONS.o2 },
    { label: "Code status", key: "codeStatus", options: MISC_OPTIONS.codeStatus },
    { label: "GI ppx", key: "giPpx", options: MISC_OPTIONS.giPpx },
    { label: "Bowel ppx", key: "bowelPpx", options: MISC_OPTIONS.bowelPpx },
    { label: "DVT ppx", key: "dvtPpx", options: MISC_OPTIONS.dvtPpx },
    { label: "Dispo", key: "dispo", options: MISC_OPTIONS.dispo },
    { label: "DPOA", key: "dpoa", options: [], isFreeText: true },
    { label: "Diet", key: "diet", options: MISC_OPTIONS.diet },
  ];

  return (
    <div className="bg-stone-900/50 border border-stone-800 rounded-[40px] p-8 mt-12 shadow-2xl">
      <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
        <ClipboardList className="h-6 w-6 text-blue-500" /> Miscellaneous Plan
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {categories.map((cat) => (
          <div key={cat.label} className="space-y-4">
            <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest block border-b border-stone-800 pb-2">{cat.label}</label>
            
            {cat.isFreeText ? (
              <input 
                type="text"
                value={misc[cat.key as keyof typeof misc] || ""}
                onChange={(e) => updateMisc(cat.key as any, e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-300 focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-stone-800"
                placeholder={`Enter ${cat.label}...`}
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {cat.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => updateMisc(cat.key as any, opt)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${
                      misc[cat.key as keyof typeof misc] === opt
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                        : "bg-stone-800/40 border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// DRAGGABLE MED COMPONENT
function DraggableMedication({ med, isOverlay = false }: { med: Medication; isOverlay?: boolean; key?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: med.id,
    data: { type: "medication", med }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2 mb-2 rounded-lg border text-[11px] font-bold uppercase transition-all cursor-grab active:cursor-grabbing ${
        isOverlay 
          ? "bg-blue-600 border-blue-400 text-white shadow-2xl scale-105" 
          : "bg-stone-900 border-stone-800 text-stone-300 hover:border-stone-600 hover:bg-stone-800"
      }`}
    >
      <Pill className="h-3 w-3 shrink-0" />
      <span className="truncate">{med.name}</span>
      {med.dose && <span className="ml-auto opacity-50 text-[9px]">{med.dose}</span>}
    </div>
  );
}

// SAFETY MONITOR COMPONENT
function SafetyFlowMonitor({ alerts }: { alerts: SafetyAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/50 rounded-2xl p-4 flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Safety System Nominal</h4>
          <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight">No critical flow conflicts detected in A&P.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 mb-8 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-red-500" /> Clinical Flow & Safety Alerts
        </h4>
        <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full">{alerts.length}</span>
      </div>
      <div className="space-y-3">
        {alerts.map(alert => (
          <div key={alert.id} className={`flex items-start gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
            alert.type === "error" 
              ? "bg-red-950/20 border-red-900/50 text-red-200" 
              : alert.type === "warning"
              ? "bg-amber-950/20 border-amber-900/50 text-amber-200"
              : "bg-blue-950/20 border-blue-900/50 text-blue-200"
          }`}>
             <div className="mt-0.5">
               {alert.type === "error" ? <X className="h-4 w-4 text-red-500" /> : 
                alert.type === "warning" ? <AlertCircle className="h-4 w-4 text-amber-500" /> : 
                <Info className="h-4 w-4 text-blue-500" />}
             </div>
             <p className="text-[11px] font-bold leading-tight tracking-tight mt-0.5">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// PROBLEM CONTAINER COMPONENT
function ProblemContainer({ problem, patient, onUpdate, onDelete, alerts }: { 
  problem: Problem; 
  patient: Patient;
  onUpdate: (id: string, data: Partial<Problem>) => void;
  onDelete: (id: string) => void;
  key?: string;
  alerts: SafetyAlert[];
}) {
  const { setNodeRef, isOver } = useSortable({
    id: problem.id,
    data: { type: "problem", problemId: problem.id }
  });

  const { updatePatient } = usePatients();
  const [isAddingDdx, setIsAddingDdx] = useState(false);
  const [newDdx, setNewDdx] = useState("");
  const [isAddingMedTest, setIsAddingMedTest] = useState(false);
  const [newMedTest, setNewMedTest] = useState("");

  const statusIcons = {
    new: <AlertCircle className="h-4 w-4 text-white" />,
    stable: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    improving: <TrendingUp className="h-4 w-4 text-blue-400" />,
    worsening: <TrendingDown className="h-4 w-4 text-red-400" />
  };

  const addDdx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDdx.trim()) return;
    onUpdate(problem.id, { ddx: [...problem.ddx, newDdx.trim()] });
    setNewDdx("");
    setIsAddingDdx(false);
  };

  const addMedTest = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newMedTest.trim();
    if (!val) return;
    
    const medId = uuidv4();
    const newMed: Medication = {
      id: medId,
      name: val,
      dose: "",
      route: "PO",
      frequency: "QD",
      flag: "none"
    };

    // Update global medications and link to problem
    const updatedMeds = [...patient.medications, newMed];
    
    const updatedProblems = patient.problems.map(p => 
      p.id === problem.id ? { ...p, medicationIds: [...p.medicationIds, medId] } : p
    );

    updatePatient(patient.id, { 
      medications: updatedMeds,
      problems: updatedProblems
    });

    setNewMedTest("");
    setIsAddingMedTest(false);
  };

  const removeDdx = (index: number) => {
    const updated = [...problem.ddx];
    updated.splice(index, 1);
    onUpdate(problem.id, { ddx: updated });
  };

  const removeTest = (index: number) => {
    const updated = [...(problem.tests || [])];
    updated.splice(index, 1);
    onUpdate(problem.id, { tests: updated });
  };

  const removeMed = (medId: string) => {
    onUpdate(problem.id, { medicationIds: problem.medicationIds.filter(id => id !== medId) });
  };

  const problemAlerts = alerts.filter(a => a.problemId === problem.id);

  return (
    <div 
      ref={setNodeRef}
      className={`bg-stone-900/50 border rounded-2xl p-6 shadow-xl transition-all h-fit relative overflow-hidden ${
        isOver ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-950/5 scale-[1.01]" : "border-stone-800"
      }`}
    >
      {problemAlerts.length > 0 && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />
      )}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <input 
            type="text" 
            value={problem.title} 
            onChange={(e) => onUpdate(problem.id, { title: e.target.value })}
            className="w-full bg-transparent border-none focus:ring-0 text-lg font-black text-white uppercase tracking-tight p-0 placeholder:text-stone-700"
            placeholder="PROBLEM NAME"
          />
        </div>
        <button onClick={() => onDelete(problem.id)} className="p-2 text-stone-600 hover:text-red-400 transition-colors">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* STATUS TOGGLES */}
      <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 mb-6 w-full">
        {(["stable", "new", "improving", "worsening"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onUpdate(problem.id, { status: s })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-[10px] font-black uppercase transition-all ${
              problem.status === s 
                ? "bg-stone-800 text-white shadow-lg shadow-black/40 ring-1 ring-stone-700" 
                : "text-stone-600 hover:text-stone-400"
            }`}
          >
            {statusIcons[s]}
            <span className="hidden sm:inline">{s}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {/* DDX SUB-CONTAINERS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-blue-500" /> DDX Sub-Containers
            </h4>
            <button onClick={() => setIsAddingDdx(true)} className="p-1 hover:bg-stone-800 rounded-lg text-stone-600 hover:text-white transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {problem.ddx.map((item, idx) => (
              <div key={idx} className="bg-stone-100/5 border border-stone-700 px-3 py-1.5 rounded-lg flex items-center gap-2 group">
                <span className="text-[10px] font-bold text-stone-400 uppercase italic">/ {item}</span>
                <button onClick={() => removeDdx(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-600 hover:text-red-400">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {isAddingDdx && (
              <form onSubmit={addDdx} className="animate-in zoom-in duration-200">
                <input 
                  type="text" 
                  autoFocus 
                  value={newDdx}
                  onChange={(e) => setNewDdx(e.target.value)}
                  onBlur={() => !newDdx.trim() && setIsAddingDdx(false)}
                  className="bg-blue-600 text-white text-[10px] font-bold uppercase border-none rounded-lg py-1.5 px-3 focus:ring-0 placeholder:text-blue-300 w-32"
                  placeholder="ENTRY..."
                />
              </form>
            )}
          </div>
        </div>

        {/* MANAGEMENT + MEDS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-3 w-3 text-blue-500" /> Management (Meds/Tests)
            </h4>
            <button onClick={() => setIsAddingMedTest(true)} className="p-1 hover:bg-stone-800 rounded-lg text-stone-600 hover:text-white transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          
          <div className="space-y-2 pb-2">
            {/* INLINE MEDS (from drag or template) */}
            {problem.medicationIds.map(mid => {
              const med = patient.medications.find(m => m.id === mid);
              if (!med) return null;
              return (
                <div key={mid} className="bg-black/20 border border-stone-800 p-2 rounded-xl flex flex-col gap-2 group shadow transition-all hover:border-stone-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="text-[10px] font-black text-stone-100 uppercase tracking-tight">{med.name}</span>
                    </div>
                    <button onClick={() => removeMed(mid)} className="text-stone-700 hover:text-red-400 transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={med.dose || ""}
                      placeholder="Dose"
                      onChange={(e) => {
                        const updatedMeds = patient.medications.map(m => m.id === mid ? { ...m, dose: e.target.value } : m);
                        updatePatient(patient.id, { medications: updatedMeds });
                      }}
                      className="flex-1 bg-stone-900 border border-stone-800/50 rounded-lg px-2 py-1 text-[9px] font-bold text-stone-400 focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    />
                    <select 
                      value={med.frequency || ""}
                      onChange={(e) => {
                        const updatedMeds = patient.medications.map(m => m.id === mid ? { ...m, frequency: e.target.value } : m);
                        updatePatient(patient.id, { medications: updatedMeds });
                      }}
                      className="flex-1 bg-stone-900 border border-stone-800/50 rounded-lg px-2 py-1 text-[9px] font-bold text-stone-500 appearance-none focus:ring-1 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="">Freq</option>
                      <option value="QD">QD</option>
                      <option value="BID">BID</option>
                      <option value="TID">TID</option>
                      <option value="QID">QID</option>
                      <option value="Q4H">Q4H</option>
                      <option value="Q6H">Q6H</option>
                      <option value="PRN">PRN</option>
                    </select>
                  </div>
                </div>
              );
            })}

            {/* AD-HOC TESTS/ACTIONS */}
            {problem.tests?.map((test, idx) => (
               <div key={idx} className="bg-stone-950 border border-stone-800/50 p-2 rounded-xl flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-stone-600" />
                     <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tight italic">{test}</span>
                  </div>
                  <button onClick={() => removeTest(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-700 hover:text-red-400 font-bold">
                    <X className="h-3 w-3" />
                  </button>
               </div>
            ))}

            {isAddingMedTest && (
              <form onSubmit={addMedTest} className="animate-in slide-in-from-left-2 duration-300">
                <input 
                  type="text" 
                  autoFocus 
                  value={newMedTest}
                  onChange={(e) => setNewMedTest(e.target.value)}
                  onBlur={() => !newMedTest.trim() && setIsAddingMedTest(false)}
                  className="w-full bg-blue-900/30 border border-blue-500/30 text-blue-200 text-[10px] font-bold uppercase rounded-xl py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-blue-700"
                  placeholder="New Med or Test..."
                />
              </form>
            )}
          </div>
        </div>

        {/* ASSESSMENT & ORDERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-stone-600 uppercase tracking-widest block">Assessment</label>
            <textarea 
              value={problem.assessment}
              onChange={(e) => onUpdate(problem.id, { assessment: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-300 resize-none h-24 focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-stone-800"
              placeholder="Case rationale..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-stone-600 uppercase tracking-widest block">Orders (Non-Med)</label>
            <textarea 
              value={problem.orders}
              onChange={(e) => onUpdate(problem.id, { orders: e.target.value })}
              className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-400 resize-none h-24 focus:ring-2 focus:ring-blue-600 focus:outline-none placeholder:text-stone-800 italic"
              placeholder="Radiology, Labs..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// SYSTEM COLORS MAPPING
const SYSTEM_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Cardiovascular": { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  "Pulmonary": { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  "Renal/Lytes": { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  "Infectious Disease": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  "Gastroenterology": { bg: "bg-stone-500/10", text: "text-stone-400", border: "border-stone-500/20" },
  "Neurology": { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/20" },
  "Endocrine": { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  "Hematology": { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" },
  "Rheumatology": { bg: "bg-lime-500/10", text: "text-lime-400", border: "border-lime-500/20" },
  "Behavioral/Tox": { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
};

export function NotesTab({ patient }: { patient: Patient }) {
  const { updatePatient } = usePatients();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Group templates by system
  const groupedTemplates = useMemo(() => {
    return PROBLEM_TEMPLATES.reduce((acc, template) => {
      const system = template.system || "Other";
      if (!acc[system]) acc[system] = [];
      acc[system].push(template);
      return acc;
    }, {} as Record<string, typeof PROBLEM_TEMPLATES>);
  }, []);

  const sortedSystems = useMemo(() => Object.keys(groupedTemplates).sort(), [groupedTemplates]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const problems = patient.problems || [];
  const alerts = useMemo(() => runSafetyChecks(patient), [patient]);
  
  const assignedMedIds = useMemo(() => {
    return new Set(problems.flatMap(p => p.medicationIds));
  }, [problems]);

  const unassignedMeds = patient.medications.filter(m => !assignedMedIds.has(m.id));

  const addProblem = (template?: typeof PROBLEM_TEMPLATES[0]) => {
    const newMedIds: string[] = [];
    const newMeds: Medication[] = [];

    if (template?.medications) {
      template.medications.forEach(m => {
        // Check if med already exists in global list to prevent duplicates
        const existingMed = patient.medications.find(
          em => em.name.toLowerCase().trim() === m.name.toLowerCase().trim()
        );

        if (existingMed) {
          newMedIds.push(existingMed.id);
        } else {
          const id = uuidv4();
          newMedIds.push(id);
          newMeds.push({
            id,
            name: m.name,
            dose: m.dose,
            frequency: m.frequency as any,
            route: "PO",
            flag: "none"
          });
        }
      });
    }

    const newProblem: Problem = {
      id: uuidv4(),
      title: template?.title || "New Problem",
      status: "new",
      assessment: template?.assessment || "",
      ddx: template?.ddx || [],
      medicationIds: newMedIds,
      tests: [],
      orders: "",
    };

    updatePatient(patient.id, { 
      problems: [...problems, newProblem],
      medications: [...patient.medications, ...newMeds]
    });
    setShowTemplates(false);
  };

  const updateProblem = (id: string, data: Partial<Problem>) => {
    const updated = problems.map(p => p.id === id ? { ...p, ...data } : p);
    updatePatient(patient.id, { problems: updated });
  };

  const deleteProblem = (id: string) => {
    updatePatient(patient.id, { problems: problems.filter(p => p.id !== id) });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && over.data.current?.type === "problem") {
      const targetProblemId = over.data.current.problemId;
      const medId = active.id as string;
      
      const targetProblem = problems.find(p => p.id === targetProblemId);
      if (targetProblem && !targetProblem.medicationIds.includes(medId)) {
        updateProblem(targetProblemId, { 
          medicationIds: [...targetProblem.medicationIds, medId] 
        });
      }
    }
  };

  const generateNote = () => {
    let note = "";
    note += `Impression/Plan for ${patient.name}:\n`;
    note += `This is a ${patient.age}yo ${patient.gender} with PMHx ${patient.diagnosis} presenting with ${patient.oneLiner}.\n\n`;

    problems.forEach(p => {
      note += `# ${p.title} (${p.status.toUpperCase()})\n`;
      if (p.assessment) note += `${p.assessment}\n\n`;

      if (p.ddx.length > 0) {
        note += `DDx: \n`;
        p.ddx.forEach(item => {
          note += `>${item}\n`;
        });
        note += `\n`;
      }

      const hasMeds = p.medicationIds.length > 0;
      const hasTests = p.tests && p.tests.length > 0;

      if (hasMeds || hasTests || p.orders) {
        note += `PLAN: \n`;
        // Meds
        p.medicationIds.forEach(mid => {
          const med = patient.medications.find(m => m.id === mid);
          if (med) note += `- ${med.name} ${med.dose || ""} ${med.frequency || ""}\n`;
        });
        // Tests
        if (p.tests && p.tests.length > 0) {
          p.tests.forEach(test => note += `- ${test}\n`);
        }
        if (p.orders) note += `- ${p.orders}\n`;
        note += "\n";
      }
    });

    if (unassignedMeds.length > 0) {
      note += "# Other Medications\n";
      unassignedMeds.forEach(m => {
        note += `- ${m.name} ${m.dose || ""} ${m.frequency || ""}\n`;
      });
      note += "\n";
    }

    note += "\nPHYSICAL EXAM:\n" + patient.examNote;

    const misc = patient.misc;
    if (misc) {
      note += "\nMISC\n";
      note += `O2: ${misc.o2}\n`;
      note += `Code status: ${misc.codeStatus}\n`;
      note += `GI ppx: ${misc.giPpx}\n`;
      note += `Bowel ppx: ${misc.bowelPpx}\n`;
      note += `DVT ppx: ${misc.dvtPpx}\n`;
      note += `Dispo: ${misc.dispo}\n`;
      note += `DPOA: ${misc.dpoa}\n`;
      note += `Diet: ${misc.diet}\n`;
    }

    return note;
  };

  const copyNote = () => {
     navigator.clipboard.writeText(generateNote());
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        {/* SIDEBAR: UNASSIGNED MEDS */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl sticky top-0">
             <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                <span>Available Meds</span>
                <span className="bg-stone-800 text-stone-400 px-2 py-0.5 rounded text-[8px]">{unassignedMeds.length}</span>
             </h3>
             
             <SortableContext items={unassignedMeds.map(m => m.id)} strategy={verticalListSortingStrategy}>
               <div className="space-y-1">
                 {unassignedMeds.map(med => (
                   <DraggableMedication key={med.id} med={med} />
                 ))}
                 {unassignedMeds.length === 0 && (
                   <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-stone-800/50 rounded-2xl opacity-30">
                     <CheckCircle2 className="h-8 w-8 mb-2" />
                     <p className="text-[10px] font-bold uppercase tracking-widest text-center">All medals assigned</p>
                   </div>
                 )}
               </div>
             </SortableContext>

             <div className="mt-12 pt-12 border-t border-stone-800">
                <button 
                  onClick={copyNote}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                >
                  <Copy className="h-4 w-4" /> Copy Full Note
                </button>
             </div>
          </div>
        </div>

        {/* MAIN PANEL: PROBLEM CONTAINERS */}
        <div className="lg:col-span-9 space-y-8">
           <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                 <div className="w-4 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)]" />
                 <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Assessment & Plan</h2>
                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Interactive rounded workflow</p>
                 </div>
              </div>

              <div className="relative">
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => addProblem()}
                    className="flex items-center gap-2 bg-stone-100 text-stone-950 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl active:scale-95"
                   >
                     <Plus className="h-4 w-4" /> Add Problem
                   </button>
                   <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className={`p-3 rounded-2xl border transition-all ${showTemplates ? "bg-stone-800 border-stone-700 text-white shadow-inner" : "bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300"}`}
                   >
                     <Menu className="h-5 w-5" />
                   </button>
                </div>

                {showTemplates && (
                  <div className="absolute right-0 mt-3 w-80 bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-4 duration-300 max-h-[70vh] overflow-y-auto">
                    <h4 className="text-[10px] font-black text-stone-600 px-4 py-3 uppercase tracking-widest border-b border-stone-800 mb-2">Problem Templates</h4>
                    <div className="space-y-4 pb-4">
                      {sortedSystems.map(system => (
                        <div key={system} className="space-y-1">
                          <div className={`px-4 py-1.5 flex items-center gap-2 border-l-2 ${SYSTEM_COLORS[system]?.border || "border-stone-700"}`}>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${SYSTEM_COLORS[system]?.text || "text-stone-500"}`}>
                              {system}
                            </span>
                          </div>
                          {groupedTemplates[system].map((t, idx) => (
                            <button
                              key={`${system}-${idx}`}
                              onClick={() => {
                                addProblem(t);
                                setShowTemplates(false);
                              }}
                              className="w-full text-left p-3 hover:bg-stone-800/50 rounded-xl transition-all group mx-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className={`text-[11px] font-bold text-stone-200 uppercase tracking-tight group-hover:translate-x-1 transition-transform`}>{t.title}</span>
                                <Plus className={`h-3 w-3 text-stone-700 transition-colors ${SYSTEM_COLORS[system]?.text || "group-hover:text-blue-500"}`} />
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
           </div>

           <SafetyFlowMonitor alerts={alerts} />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {problems.map(p => (
                <ProblemContainer 
                  key={p.id} 
                  problem={p} 
                  patient={patient}
                  onUpdate={updateProblem}
                  onDelete={deleteProblem}
                  alerts={alerts}
                />
              ))}
              {problems.length === 0 && (
                 <div className="col-span-full py-32 flex flex-col items-center justify-center bg-stone-900/30 border-2 border-dashed border-stone-800/50 rounded-[40px] opacity-20">
                    <Stethoscope className="h-16 w-16 mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.3em] text-center">No problems listed.<br/>Tap the menu to start with a template.</p>
                 </div>
              )}
           </div>

           <MiscSection patient={patient} />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId && unassignedMeds.find(m => m.id === activeId) ? (
          <DraggableMedication 
            med={unassignedMeds.find(m => m.id === activeId)!} 
            isOverlay 
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

