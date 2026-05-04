import { Medication } from "../types";

/**
 * A mapping of common medication names (or substrings) to problem keywords.
 * This helps "smartly" assign meds to problems without AI.
 */
const MED_TO_PROBLEM_MAP: Record<string, string[]> = {
  "lisinopril": ["HTN", "Hypertension", "CHF", "Heart Failure"],
  "metoprolol": ["HTN", "Hypertension", "Afib", "Atrial Fibrillation", "CHF", "Heart Failure", "Tachycardia"],
  "amlodipine": ["HTN", "Hypertension"],
  "hydralazine": ["HTN", "Hypertension"],
  "losartan": ["HTN", "Hypertension", "CHF", "Heart Failure"],
  "diltiazem": ["HTN", "Hypertension", "Afib", "Atrial Fibrillation", "Tachycardia"],
  "carvedilol": ["CHF", "Heart Failure", "HTN", "Hypertension", "Afib"],
  "furosemide": ["CHF", "Heart Failure", "Edema", "Fluid Overload"],
  "lasix": ["CHF", "Heart Failure", "Edema", "Fluid Overload"],
  "bumetanide": ["CHF", "Heart Failure", "Edema", "Fluid Overload"],
  "spironolactone": ["CHF", "Heart Failure", "HTN", "Hypertension", "Cirrhosis"],
  "metformin": ["DM", "Diabetes", "Hyperglycemia"],
  "insulin": ["DM", "Diabetes", "Hyperglycemia"],
  "glipizide": ["DM", "Diabetes", "Hyperglycemia"],
  "atorvastatin": ["HLD", "Hyperlipidemia", "Cholesterol", "CAD", "Stroke"],
  "simvastatin": ["HLD", "Hyperlipidemia", "Cholesterol", "CAD", "Stroke"],
  "rosuvastatin": ["HLD", "Hyperlipidemia", "Cholesterol", "CAD", "Stroke"],
  "statin": ["HLD", "Hyperlipidemia", "Cholesterol"],
  "aspirin": ["CAD", "Stroke", "ACS", "MI", "DVT", "Cardiovascular"],
  "clopidogrel": ["Stroke", "CAD", "Stent", "ACS"],
  "plavix": ["Stroke", "CAD", "Stent", "ACS"],
  "apixaban": ["Afib", "DVT", "PE", "Anticoagulation"],
  "eliquis": ["Afib", "DVT", "PE", "Anticoagulation"],
  "rivaroxaban": ["Afib", "DVT", "PE", "Anticoagulation"],
  "xarelto": ["Afib", "DVT", "PE", "Anticoagulation"],
  "warfarin": ["Afib", "DVT", "PE", "Anticoagulation"],
  "coumadin": ["Afib", "DVT", "PE", "Anticoagulation"],
  "heparin": ["DVT", "PE", "Anticoagulation"],
  "lovenox": ["DVT", "PE", "Anticoagulation"],
  "albuterol": ["Asthma", "COPD", "Wheezing", "Respiratory"],
  "ipratropium": ["COPD", "Asthma", "Respiratory"],
  "beclomethasone": ["Asthma", "COPD", "Respiratory"],
  "symbicort": ["Asthma", "COPD", "Respiratory"],
  "advair": ["Asthma", "COPD", "Respiratory"],
  "levothyroxine": ["Hypothyroid", "Thyroid"],
  "synthroid": ["Hypothyroid", "Thyroid"],
  "pantoprazole": ["GERD", "Reflux", "Gastritis", "GI"],
  "protonix": ["GERD", "Reflux", "Gastritis", "GI"],
  "omeprazole": ["GERD", "Reflux", "Gastritis", "GI"],
  "famotidine": ["GERD", "Reflux", "Gastritis", "GI"],
  "pepcid": ["GERD", "Reflux", "Gastritis", "GI"],
  "gabapentin": ["Neuropathy", "Pain", "Seizure"],
  "pregabalin": ["Neuropathy", "Pain", "Seizure"],
  "lyrica": ["Neuropathy", "Pain", "Seizure"],
  "trazodone": ["Sleep", "Insomnia", "Depression"],
  "melatonin": ["Sleep", "Insomnia"],
  "zoloft": ["Depression", "Anxiety", "SSRI"],
  "sertraline": ["Depression", "Anxiety", "SSRI"],
  "fluoxetine": ["Depression", "Anxiety", "SSRI"],
  "prozac": ["Depression", "Anxiety", "SSRI"],
  "escitalopram": ["Depression", "Anxiety", "SSRI"],
  "lexapro": ["Depression", "Anxiety", "SSRI"],
  "alprazolam": ["Anxiety"],
  "xanax": ["Anxiety"],
  "lorazepam": ["Anxiety", "Seizure", "Ativan"],
  "acetaminophen": ["Pain", "Fever", "Tylenol"],
  "ibuprofen": ["Pain", "Inflammation", "NSAID"],
  "oxycodone": ["Pain", "Opioid"],
  "morphine": ["Pain", "Opioid"],
  "hydromorphone": ["Pain", "Opioid"],
  "dilaudid": ["Pain", "Opioid"],
  "senna": ["Constipation", "Bowel"],
  "docusate": ["Constipation", "Bowel"],
  "colace": ["Constipation", "Bowel"],
  "miralax": ["Constipation", "Bowel"],
  "polyethylene glycol": ["Constipation", "Bowel"],
  "ondansetron": ["Nausea", "Vomiting", "Zofran"],
  "zofran": ["Nausea", "Vomiting"],
  "ceftriaxone": ["Pneumonia", "UTI", "Infection", "Antibiotic"],
  "azithromycin": ["Pneumonia", "Infection", "Antibiotic"],
  "vancomycin": ["Infection", "MRSA", "Antibiotic"],
  "piperacillin": ["Infection", "Sepsis", "Antibiotic"],
  "zosyn": ["Infection", "Sepsis", "Antibiotic"],
  "levofloxacin": ["Infection", "Pneumonia", "Antibiotic"],
  "ciprofloxacin": ["Infection", "UTI", "Antibiotic"],
};

export function getMedsForProblem(problemText: string, allMeds: Medication[]): Medication[] {
  const normalizedProblem = problemText.toLowerCase();
  return allMeds.filter(med => {
    const medName = med.name.toLowerCase();
    
    // Check our map
    for (const [key, indications] of Object.entries(MED_TO_PROBLEM_MAP)) {
      if (medName.includes(key.toLowerCase())) {
        // If this med matches the map key, check if any of its indications appear in the problem text
        if (indications.some(ind => normalizedProblem.includes(ind.toLowerCase()))) {
          return true;
        }
      }
    }
    return false;
  });
}
