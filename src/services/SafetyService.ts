import { Patient, Problem, Medication } from "../types";

export interface SafetyAlert {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  problemId?: string;
  medicationId?: string;
  category: "medication" | "assessment" | "safety";
}

export function runSafetyChecks(patient: Patient): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const problems = patient.problems || [];
  const medications = patient.medications || [];

  // 1. Duplicate Medication Check (Global)
  const medCounts: Record<string, number> = {};
  medications.forEach(m => {
    const name = m.name.toLowerCase().trim();
    medCounts[name] = (medCounts[name] || 0) + 1;
  });
  Object.keys(medCounts).forEach(name => {
    if (medCounts[name] > 1) {
      alerts.push({
        id: `dup-${name}`,
        type: "warning",
        category: "medication",
        message: `Duplicate medication entry: ${name.toUpperCase()}. Consider consolidating dosages.`
      });
    }
  });

  // 2. Cross-Problem Conflict & Dose Mismatch
  const medLinks: Record<string, { problemId: string; dose?: string; action?: string }[]> = {};
  problems.forEach(p => {
    p.medicationIds.forEach(mid => {
      const med = medications.find(m => m.id === mid);
      if (med) {
        if (!medLinks[med.name.toLowerCase()]) medLinks[med.name.toLowerCase()] = [];
        medLinks[med.name.toLowerCase()].push({
          problemId: p.id,
          dose: med.dose,
          action: med.flag || "none"
        });
      }
    });
  });

  Object.keys(medLinks).forEach(name => {
    const links = medLinks[name];
    if (links.length > 1) {
      // Check for dose conflicts
      const doses = new Set(links.map(l => l.dose?.toLowerCase().trim()).filter(Boolean));
      if (doses.size > 1) {
        alerts.push({
          id: `dose-conflict-${name}`,
          type: "error",
          category: "medication",
          message: `Dose conflict for ${name.toUpperCase()} across problems: ${Array.from(doses).join(" vs ")}.`
        });
      }

      // Check for Action conflicts (Hold vs Cont)
      const actions = new Set(links.map(l => l.action));
      if (actions.has("hold") && (actions.has("none") || actions.has("dose_change"))) {
        alerts.push({
          id: `action-conflict-${name}`,
          type: "error",
          category: "medication",
          message: `Conflicting plan for ${name.toUpperCase()}: One problem holds it while another continues it.`
        });
      }
    }
  });

  // 3. Clinical Rules (AKI, Hyperkalemia, etc.)
  const problemTitles = problems.map(p => p.title.toLowerCase());
  const medNames = medications.map(m => m.name.toLowerCase());

  // AKI Hazard
  if (problemTitles.some(t => t.includes("aki") || t.includes("kidney injury") || t.includes("renal failure"))) {
    const nephrotoxins = ["ibuprofen", "advil", "motrin", "toradol", "ketorolac", "naproxen", "lisinopril", "losartan", "gentamicin"];
    nephrotoxins.forEach(toxin => {
      if (medNames.some(m => m.includes(toxin))) {
        alerts.push({
          id: `aki-hazard-${toxin}`,
          type: "error",
          category: "safety",
          message: `AKI detected: ${toxin.toUpperCase()} is potentially nephrotoxic. Review usage.`
        });
      }
    });
  }

  // Hyperkalemia Hazard
  if (problemTitles.some(t => t.includes("hyperkalemia") || t.includes("high k") || t.includes("potassium"))) {
    const kSparers = ["lisinopril", "losartan", "spironolactone", "valsartan", "enalapril"];
    kSparers.forEach(drug => {
      if (medNames.some(m => m.includes(drug))) {
        alerts.push({
          id: `k-hazard-${drug}`,
          type: "warning",
          category: "safety",
          message: `Hyperkalemia Concern: ${drug.toUpperCase()} may further increase potassium.`
        });
      }
    });
  }

  // Bleeding Hazard
  if (problemTitles.some(t => t.includes("gib") || t.includes("bleed") || t.includes("hemorrhage") || t.includes("anemia"))) {
    const anticoagulants = ["heparin", "apixaban", "rivaroxaban", "warfarin", "aspirin", "clopidogrel", "enoxaparin", "lovenox"];
    anticoagulants.forEach(drug => {
      if (medNames.some(m => m.includes(drug))) {
        alerts.push({
          id: `bleed-hazard-${drug}`,
          type: "error",
          category: "safety",
          message: `Active Bleed/Anemia concern: ${drug.toUpperCase()} carries high bleeding risk.`
        });
      }
    });
  }

  // Anticoagulation Overlap
  const acList = ["heparin", "apixaban", "rivaroxaban", "warfarin", "enoxaparin", "lovenox", "dabigatran"];
  const presentACs = medNames.filter(m => acList.some(ac => m.includes(ac)));
  if (presentACs.length > 1) {
    alerts.push({
      id: `ac-overlap`,
      type: "error",
      category: "safety",
      message: `Multiple anticoagulants detected: ${presentACs.map(s => s.toUpperCase()).join(", ")}. High risk of fatal hemorrhage.`
    });
  }

  // 4. Assessment Integrity
  problems.forEach(p => {
    if (p.status === "worsening" && !p.assessment.trim()) {
      alerts.push({
        id: `empty-worsening-${p.id}`,
        type: "warning",
        category: "assessment",
        problemId: p.id,
        message: `Problem "${p.title}" is WORSENING but assessment rationale is missing.`
      });
    }
    if (p.status === "new" && p.medicationIds.length === 0 && (p.tests || []).length === 0 && !p.orders.trim()) {
      alerts.push({
        id: `new-no-plan-${p.id}`,
        type: "warning",
        category: "assessment",
        problemId: p.id,
        message: `NEW Problem "${p.title}" has no linked medications, tests, or orders.`
      });
    }
  });

  // 5. Specific Guidelines (HF + Beta Blocker)
  if (problemTitles.some(t => t.includes("heart failure") || t.includes("chf") || t.includes("hfr ef"))) {
    const betaBlockers = ["metoprolol", "carvedilol", "bisoprolol", "atenolol"];
    if (!medNames.some(m => betaBlockers.some(bb => m.includes(bb)))) {
      alerts.push({
        id: `hf-bb-missing`,
        type: "info",
        category: "safety",
        message: `Guideline Alert: Patient has Heart Failure but no Beta-Blocker is listed in Plan.`
      });
    }
  }

  // 6. Untreated Fever
  if (problemTitles.some(t => t.includes("fever") || t.includes("febrile"))) {
    if (!medNames.some(m => m.includes("acetaminophen") || m.includes("tylenol"))) {
      alerts.push({
        id: `fever-untreated`,
        type: "info",
        category: "medication",
        message: `Fever mentioned but no antipyretic (Tylenol) is scheduled or PRN.`
      });
    }
  }

  // 7. Steroid Taper Mention
  if (medNames.some(m => m.includes("prednisone") || m.includes("dexmethasone") || m.includes("hydrocortisone"))) {
     const hasTaperText = problems.some(p => p.orders.toLowerCase().includes("taper") || p.assessment.toLowerCase().includes("taper"));
     if (!hasTaperText) {
       alerts.push({
         id: `steroid-taper`,
         type: "info",
         category: "assessment",
         message: `Steroids in use. Ensure a taper plan is documented for prolonged courses.`
       });
     }
  }

  // 8. ACS/Ischemia without Statin/Aspirin
  if (problemTitles.some(t => t.includes("acs") || t.includes("ischemia") || t.includes("mi") || t.includes("coronary"))) {
    if (!medNames.some(m => m.includes("statin") || m.includes("atorvastatin") || m.includes("rosuvastatin"))) {
      alerts.push({
        id: `acs-statin-missing`,
        type: "warning",
        category: "safety",
        message: `ACS/Coronary Disease detected: High-intensity statin is recommended.`
      });
    }
  }

  // 9. DM without Glucose Checks
  if (problemTitles.some(t => t.includes("diabetes") || t.includes("dm") || t.includes("dka") || t.includes("hyperglycemia"))) {
    const hasChecks = problems.some(p => p.orders.toLowerCase().includes("glucose") || p.orders.toLowerCase().includes("accucheck") || p.orders.toLowerCase().includes("fingerstick"));
    if (!hasChecks) {
      alerts.push({
        id: `dm-monitoring`,
        type: "info",
        category: "safety",
        message: `Diabetes documented. Ensure fingerstick blood glucose monitoring is ordered.`
      });
    }
  }

  return alerts;
}
