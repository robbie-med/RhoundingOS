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
    assessment: "Acute decompensated heart failure with volume overload. Hemodynamics: [HDS SBP >90 / HDUS SBP <90]. Goal is diuresis to dry weight and optimization of GDMT. Monitoring for need for NIPPV/Inotropes.",
    ddx: ["Ischemic Cardiomyopathy", "Hypertensive Emergency", "Valvular Heart Disease (MR/AR)", "Flash Pulmonary Edema", "Pneumonia"],
    medications: [
      { name: "Furosemide", dose: "40-80mg (1-2.5x home dose)", frequency: "BID" },
      { name: "Lisinopril", dose: "10mg", frequency: "QD" },
      { name: "Metoprolol Succinate", dose: "25mg", frequency: "QD" }
    ],
    orders: "Continuous telemetry; Daily weights; Strict I/Os; Goal UOP >100-150 mL/hr; Pro-BNP; Daily BMP/CBC; Cardiac echo if not done in 6 mos."
  },
  { 
    system: "Cardiovascular",
    title: "STEMI (Emergency)", 
    assessment: "ST-Elevation Myocardial Infarction identified by EKG. High risk for malignant arrhythmia and cardiogenic shock. Emergent reperfusion indicated.",
    ddx: ["Acute Myocardial Infarction", "Aortic Dissection", "Pericarditis", "Takotsubo Cardiomyopathy"],
    medications: [
      { name: "Aspirin", dose: "325mg", frequency: "Once" },
      { name: "Clopidogrel", dose: "600mg (load)", frequency: "Once" },
      { name: "Atorvastatin", dose: "80mg", frequency: "QD" },
      { name: "Heparin", dose: "Bolus + GTT", frequency: "QD" }
    ],
    orders: "STAT Cardiology consult for emergent PCI; Continuous telemetry; EKG and Troponins Q6H; Supplemental O2 (Target >90%); Nitro/Morphine PRN."
  },
  { 
    system: "Cardiovascular",
    title: "ACS / NSTEMI", 
    assessment: "Non-ST Elevation Myocardial Infarction. TIMI Score: [X], GRACE Score: [Y]. Risk stratifying for early invasive vs conservative management.",
    ddx: ["Unstable Angina", "NSTEMI", "Type 2 Myocardial Infarction", "Myocarditis"],
    medications: [
      { name: "Aspirin", dose: "81mg", frequency: "QD" },
      { name: "Metoprolol Tartrate", dose: "25mg", frequency: "TID" },
      { name: "Atorvastatin", dose: "80mg", frequency: "QD" }
    ],
    orders: "Consult Cardiology; Serum Troponins q3-6h; Continuous telemetry; Supplemental O2 (Target >90%); Nitro/Morphine PRN; Consider BB/ACE-i."
  },
  { 
    system: "Cardiovascular",
    title: "AFib with RVR (Acute)", 
    assessment: "Atrial Fibrillation with Rapid Ventricular Response. Hemodynamically [stable/unstable]. CHADS2-VASc: [X], HASBLED: [Y]. Goal is rate control < 110 bpm.",
    ddx: ["Thyrotoxicosis", "Pulmonary Embolism", "Sympathetic Surge", "Electrolyte abnormality (K/Mg)", "Alcohol (Holiday Heart)"],
    medications: [
      { name: "Diltiazem", dose: "15mg IV (then 5-10mg/hr GTT)", frequency: "PRN" },
      { name: "Metoprolol Tartrate", dose: "25mg", frequency: "TID" },
      { name: "Apixaban", dose: "5mg", frequency: "BID" }
    ],
    orders: "Tele; EKG; Echo; TSH; BMP; Mg/Phos; If HR >110, titrate Diltiazem GTT up to 15mg/hr."
  },
  { 
    system: "Cardiovascular",
    title: "Chest Pain (Inpatient Evaluation)", 
    assessment: "Acute chest pain, likely [Cardiac vs Non-cardiac]. HEART Score: [X]. Initial Troponin: [Y]. EKG: [Z]. Low pre-test probability for PE/Dissection.",
    ddx: ["ACS (NSTEMI/UA)", "Acute PE", "Aortic Dissection", "Tension PTX", "Pancreatitis/Biliary", "GERD"],
    medications: [
      { name: "Aspirin", dose: "81mg", frequency: "QD" },
      { name: "Nitroglycerin", dose: "0.4mg SL", frequency: "PRN" }
    ],
    orders: "Serial cardiac enzymes x 2; Serial EKGs; MPI if enzymes negative; CXR; CBC; BMP; Morphine for severe pain."
  },
  { 
    system: "Pulmonary",
    title: "Acute Respiratory Failure", 
    assessment: "Acute [Hypoxemic/Hypercarbic] respiratory failure, [improving/worsening] on [X] supplemental oxygen. Trigger likely [PNA/PE/CHF/COPD].",
    ddx: ["Pneumonia", "Pulmonary Embolism", "Pneumothorax", "ARDS", "Aspiration"],
    medications: [
      { name: "Albuterol/Ipratropium", dose: "2.5/0.5mg", frequency: "Q4H" },
      { name: "Prednisone", dose: "40mg", frequency: "QD" }
    ],
    orders: "CPO and telemetry; RT assessment PRN; Wean O2 as tolerated; Daily CBC, BMP; Consider ABG/VBG; Incentive spirometry."
  },
  { 
    system: "Renal/Lytes",
    title: "AKI (Prerenal)", 
    assessment: "Acute kidney injury, likely prerenal secondary to relative hypovolemia and systemic illness. Creatinine baseline: [X]. FeNa: [Y].",
    ddx: ["Hypovolemia/Dehydration", "Acute Tubular Necrosis (ATN)", "Postrenal Obstruction", "Hepatorenal Syndrome"],
    medications: [
      { name: "Normal Saline", dose: "Bolus vs 75cc/hr", frequency: "QD" }
    ],
    orders: "HOLD all nephrotoxins (NSAIDs, ACE-I, etc); BMP; UA with microscopy; Renal/bladder US; UNa/UCr/UOsm; Strict I/Os."
  },
  { 
    system: "Renal/Lytes",
    title: "Chronic Kidney Disease", 
    assessment: "CKD Stage [X] (GFR [Y]), likely secondary to [HTN/DM]. Renal function [stable/worsening] over past year.",
    ddx: ["Hypertensive Nephrosclerosis", "Diabetic Nephropathy", "Polycystic Kidney Disease"],
    medications: [
      { name: "Atorvastatin", dose: "20-40mg", frequency: "QD" }
    ],
    orders: "Avoid NSAIDs and nephrotoxic agents; Low-sodium/Low-potassium diet; Daily BMP to monitor for AKI; Establish baseline Cr."
  },
  { 
    system: "Hematology",
    title: "Anticoagulation Flow (Reversal Protocols)", 
    assessment: "Patient currently on [Anticoagulant]. High risk for bleeding vs currently actively bleeding. Management tailored to specific agent.",
    ddx: ["Iatrogenic Coagulopathy", "Active Hemorrhage", "GI Bleed", "Intracranial Bleed"],
    medications: [
      { name: "Protamine Sulfate (for Hep/Lovenox)", dose: "Per Pharmacy", frequency: "Once" },
      { name: "Idarucizumab (for Pradaxa)", dose: "2.5g x 2", frequency: "Once" },
      { name: "4-Factor PCC (Kcentra)", dose: "25-50 units/kg", frequency: "Once" },
      { name: "Vitamin K", dose: "1-5mg IV/PO", frequency: "Once" }
    ],
    orders: "Recheck INR in 30-60 mins; FFP 1u if actively bleeding + Coumadin; STOP Argatroban/Bival if supratherapeutic."
  },
  { 
    system: "Neurology",
    title: "Encephalopathy (Acute)", 
    assessment: "Acute change in mental status. DDx includes Metabolic (Lytes/TSH/NH3), Infectious (UTI/PNA/Meningitis), Neurologic (Sz/CVA), and Toxins.",
    ddx: ["UTI / Urosepsis", "Hepatic Encephalopathy", "Hyponatremia / Hypoxia", "Alcohol Withdrawal", "CVA/TIA/ICH"],
    medications: [
      { name: "Thiamine", dose: "100mg", frequency: "QD" },
      { name: "Lactulose", dose: "30g", frequency: "TID" }
    ],
    orders: "CMP, TSH, Ammonia, ABG; Vit B12/Folate; UA w/ micro; CXR; Head CT; Consider EEG/MRI/LP."
  },
  { 
    system: "Neurology",
    title: "Seizure (Acute/First Occurrence)", 
    assessment: "[Generalized/Focal] seizure lasting [X] mins. Evidence of post-ictal state. Plan for provoking factor workup and monitoring for recurrence.",
    ddx: ["New-onset Epilepsy", "Provoked Seizure (Lytes/Tox)", "Etoh Withdrawal", "Intracranial Lesion", "Hypoglycemia"],
    medications: [
      { name: "Levetiracetam (Keppra)", dose: "500-1000mg", frequency: "BID" },
      { name: "Lorazepam", dose: "2-4mg", frequency: "PRN" }
    ],
    orders: "Seizure precautions; Serum lactate; EEG urgently if slow return to baseline; Head CT; TSH; UDS; Etoh level; BMP."
  },
  { 
    system: "Gastroenterology",
    title: "Acute Pancreatitis", 
    assessment: "Acute epigastric pain with Lipase > 3x normal. SIRS Criteria: [Met/Not Met]. Likely [Gallstones/Alcohol/HyperTG]. Plan for aggressive resuscitation.",
    ddx: ["Choledocholithiasis", "Peptic Ulcer Perforation", "Mesenteric Ischemia", "Small Bowel Obstruction"],
    medications: [
      { name: "Lactated Ringers", dose: "250cc/hr", frequency: "QD" },
      { name: "Hydromorphone", dose: "0.5mg", frequency: "PRN" }
    ],
    orders: "NPO; Aggressive IVF; Strict I/O; Abd U/S; Lipid panel; PTH; Hold ABX unless >30% necrosis on CT."
  },
  { 
    system: "Hematology",
    title: "Heparin/Lovenox Reversal", 
    assessment: "Supratherapeutic anticoagulation or active bleeding on Heparin/Enoxaparin. Decision to reverse based on clinical urgency.",
    ddx: ["Iatrogenic bleeding", "Overdose", "Renal failure (for Lovenox)"],
    medications: [
      { name: "Protamine Sulfate", dose: "1mg per 100u Heparin", frequency: "Once" }
    ],
    orders: "Protamine sulfate IV; Recheck aPTT/Anti-Xa in 1hr; Type and Screen; Hemoglobin trend."
  },
  { 
    system: "Hematology",
    title: "Pradaxa (Dabigatran) Reversal", 
    assessment: "Active life-threatening bleeding on Dabigatran. Indicated usage of specific reversal agent.",
    ddx: ["Traumatic Hemorrhage", "GI Bleed", "ICH"],
    medications: [
      { name: "Idarucizumab (Praxbind)", dose: "5g (2.5g x 2)", frequency: "Once" }
    ],
    orders: "Idarucizumab IV 2.5g x 2 doses, 15 mins apart; Coagulation panel; STAT Hgb."
  },
  { 
    system: "Hematology",
    title: "DOAC (Rivarox/Apix/Edox) Reversal", 
    assessment: "Active bleeding on Factor Xa inhibitor. PCC utilized for reversal as Andexxa unavailable/deferred.",
    ddx: ["Factor Xa inhibition", "GI Bleed", "Surgical urgency"],
    medications: [
      { name: "4-Factor PCC (Kcentra)", dose: "50 units/kg", frequency: "Once" }
    ],
    orders: "Kcentra 50 units/kg (Max 5000 units); Vitamin K 10mg IV; STAT CBC/INR."
  },
  { 
    system: "Hematology",
    title: "Warfarin (Coumadin) Reversal", 
    assessment: "Warfarin-associated coagulopathy with active bleeding. Goal is immediate INR normalization.",
    ddx: ["Warfarin toxicity", "Vitamin K deficiency", "Liver failure"],
    medications: [
      { name: "Vitamin K", dose: "10mg", frequency: "Once" },
      { name: "Fresh Frozen Plasma (FFP)", dose: "1-2 units", frequency: "Once" }
    ],
    orders: "If severe bleed/INR >6: Kcentra 50u/kg; If INR 4-6: Kcentra 35u/kg; If INR 2-4: Kcentra 25u/kg; Recheck INR in 30 mins if FFP given; Vitamin K 1-2.5mg IV (if 24h correction) or 2.5-5mg PO (if 48h correction)."
  },
  { 
    system: "Cardiovascular",
    title: "Chronic AFib (Stable)", 
    assessment: "Chronic Atrial Fibrillation, stable. Rate well-controlled. Hemodynamically stable. Cardioversion not indicated acutely.",
    ddx: ["Baseline state"],
    medications: [
      { name: "Diltiazem", dose: "180mg", frequency: "QD" }
    ],
    orders: "CHADS2-VASc score calculated; Appropriately anticoagulated; Rate control continuation."
  },
  { 
    system: "Cardiovascular",
    title: "NSVT / QT Prolongation", 
    assessment: "Episodes of NSVT noted on telemetry. Concurrent QTc prolongation noted on EKG. Monitoring for Torsades risk.",
    ddx: ["Electrolyte derangement (Mg/K)", "Drug-induced QT (Zofran/Azithro/Fluoro)", "Ischemia", "Congenital LQTS"],
    medications: [
      { name: "Magnesium Sulfate", dose: "2g", frequency: "Once" }
    ],
    orders: "Repeat 12-lead EKG; STAT BMP/Mg/Phos; Troponin; Maintain K > 4.0 and Mg > 2.0; Review MAR for QT-prolonging drugs; EP consult."
  },
  { 
    system: "Cardiovascular",
    title: "Syncope Workup", 
    assessment: "Loss of consciousness, likely [orthostatic/vasovagal/cardiac]. No structural heart disease or exerting triggers noted.",
    ddx: ["Orthostatic Hypotension", "Vasovagal Reflex", "Arrhythmia (HB/SVT)", "Anemia", "Critical Stenosis"],
    medications: [],
    orders: "Orthostatics; EKG; Telemetry; Echocardiogram; CBC; BMP; Evaluate for high-risk criteria (SCD family hx, low EF)."
  },
  { 
    system: "Cardiovascular",
    title: "Acute Pericarditis", 
    assessment: "Sharp pleuritic chest pain improved by leaning forward. EKG shows widespread ST elevation without troponin leak.",
    ddx: ["Viral/Idiopathic Pericarditis", "Dressler Syndrome", "Uremic Pericarditis", "STEMI (Mimic)"],
    medications: [
      { name: "Ibuprofen", dose: "600-800mg", frequency: "TID" },
      { name: "Colchicine", dose: "0.5mg", frequency: "BID" }
    ],
    orders: "Echo; CRP/ESR; Troponin; Blood cultures if SIRS present; Consider Prednisone only if refractory."
  },
  { 
    system: "Pulmonary",
    title: "Acute Hypoxemic Resp Failure", 
    assessment: "Persistent low O2 saturation (SaO2 < 90% RA) or PaO2 < 60. Etiology suspicious for [Aspiration/PE/PTX/PNA].",
    ddx: ["Aspiration", "PE", "PTX", "PNA", "ARDS", "Shunting", "TACO/TRALI"],
    medications: [],
    orders: "CPO/Telemetry; RT assess PRN; CXR; Check for ARDS criteria; CBC/CMP/ABG."
  },
  { 
    system: "Renal/Lytes",
    title: "AKI on CKD III", 
    assessment: "Acute kidney injury on established CKD Stage III. Baseline Cr [X]. Likely prerenal due to [Y].",
    ddx: ["Prerenal (Dehydration)", "ATN (Ischemic/Toxic)", "Drug-induced (NSAID/ACEI)"],
    medications: [],
    orders: "Hold NSAIDs/ACE-I; IVF resuscitation; Strict I/O; BMP; Plan for establishment of new baseline."
  },
  { 
    system: "Neurology",
    title: "Weakness Workup", 
    assessment: "New onset weakness. Evaluation for Neurogenic (CVA/TIA/MS/Sz), Muscular, Electroltye, or Infectious etiology.",
    ddx: ["CVA / TIA", "Seizure (Todd's Paralysis)", "Hemiplegic Migraine", "Electrolyte imbalance (K/Phos/Mg)", "Multiple Sclerosis"],
    medications: [],
    orders: "Head CT / CTA; MRI Brain; EEG; ESR/CRP/CK; BMP/TSH/A1c; CXR/UA/Cultures."
  },
  { 
    system: "Infectious Disease",
    title: "Acute Pyelonephritis", 
    assessment: "Urine source infection with flank pain. [Sepsis criteria met/not met]. Initiating empiric coverage pending cultures.",
    ddx: ["Nephrolithiasis", "Renal Abscess", "Prostatitis"],
    medications: [
      { name: "Ceftriaxone", dose: "1g", frequency: "QD" }
    ],
    orders: "UA w/ culture; Blood cultures; Renal U/S to r/o obstruction; Narrow once sensitivities back."
  },
  { 
    system: "Rheumatology",
    title: "Low Back Pain (Acute)", 
    assessment: "Acute lower back pain, likely lumbar strain. No red flags (cauda equina, fever, weight loss, trauma).",
    ddx: ["Lumbar Strain", "Herniated Disc", "Vertebral Fracture", "Ankylosing Spondylitis"],
    medications: [
      { name: "Ibuprofen", dose: "600mg", frequency: "TID" },
      { name: "Cyclobenzaprine", dose: "5mg", frequency: "TID" }
    ],
    orders: "Conservative therapy (Rest/Ice/Heat); Physical therapy handout; Short course muscle relaxants; RTC precautions."
  },
  { 
    system: "Neurology",
    title: "Visual Changes (IIH Workup)", 
    assessment: "Headache worse with bending, pulsatile tinnitus, and transient vision loss. Evaluation for Pseudotumor Cerebri.",
    ddx: ["Idiopathic Intracranial HTN", "Venous Sinus Thrombosis", "Optic Neuritis"],
    medications: [
      { name: "Acetazolamide", dose: "500-1000mg", frequency: "BID" }
    ],
    orders: "Review Vitamin A / Tetracycline / Growth Hormone / OCP use; Fundoscopic exam; MRI Brain; MRV; Lumbar Puncture."
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
      orders: template?.orders || "",
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

    if (patient.hospitalCourse) {
      note += `# HOSPITAL COURSE\n${patient.hospitalCourse}\n\n`;
    }

    if (patient.overnightEvents) {
      note += `# OVERNIGHT EVENTS\n${patient.overnightEvents}\n\n`;
    }

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-rose-500" />
                    <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Overnight Events</h3>
                  </div>
                  <textarea
                    className="w-full bg-stone-900 border border-stone-800 rounded-[24px] p-5 text-xs text-stone-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-stone-800 min-h-[120px] shadow-inner"
                    placeholder="Describe relevant overnight clinical events or changes..."
                    value={patient.overnightEvents}
                    onChange={(e) => updatePatient(patient.id, { overnightEvents: e.target.value })}
                  />
               </div>
               <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Hospital Course Summary</h3>
                  </div>
                  <textarea
                    className="w-full bg-stone-900 border border-stone-800 rounded-[24px] p-5 text-xs text-stone-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-stone-800 min-h-[120px] shadow-inner"
                    placeholder="Synthesize the patient's trajectory and key turning points..."
                    value={patient.hospitalCourse}
                    onChange={(e) => updatePatient(patient.id, { hospitalCourse: e.target.value })}
                  />
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

