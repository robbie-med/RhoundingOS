import React, { useState } from "react";
import { Patient, ExamFinding } from "../../types";
import { Trash2, Plus, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Simple Mannequin component using SVG
function MannequinSVG({ onSelectPart }: { onSelectPart: (part: string) => void }) {
  return (
    <svg viewBox="0 0 200 400" className="w-full h-auto max-w-[200px] mx-auto drop-shadow-2xl">
      {/* Head */}
      <circle cx="100" cy="40" r="25" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Head & Neuro")} />
      {/* Chest */}
      <path d="M 60 80 Q 100 70 140 80 L 130 150 Q 100 160 70 150 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Chest & CV/Pulm")} />
      {/* Abdomen */}
      <path d="M 70 150 Q 100 160 130 150 L 125 210 Q 100 220 75 210 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Abdomen & GI/GU")} />
      {/* Groin/GU */}
      <path d="M 75 210 Q 100 235 125 210 L 115 240 Q 100 250 85 240 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("GU & Pelvis")} />
      {/* Left Arm */}
      <path d="M 60 80 Q 40 80 30 150 L 20 200 L 40 200 L 50 120 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Left Arm")} />
      {/* Right Arm */}
      <path d="M 140 80 Q 160 80 170 150 L 180 200 L 160 200 L 150 120 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Right Arm")} />
      {/* Left Leg */}
      <path d="M 75 240 L 70 380 L 95 380 L 100 245 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Left Leg")} />
      {/* Right Leg */}
      <path d="M 125 240 L 130 380 L 105 380 L 100 245 Z" fill="#1c1917" stroke="#44403c" strokeWidth="2" 
        className="cursor-pointer hover:fill-blue-900/50 hover:stroke-blue-500 transition-colors"
        onClick={() => onSelectPart("Right Leg")} />
    </svg>
  );
}

const EXAM_TEMPLATES: Record<string, string[]> = {
  "Head & Neuro": ["AOx3", "AOx1 to self", "Flat affect", "PERRL", "EOMI", "Somnolent but arousable", "Delirious", "Expressive aphasia", "Right IJ CL (Single)", "Right IJ CL (Double)", "Right IJ CL (Triple)", "Right IJ CL (Quad)"],
  "Chest & CV/Pulm": ["RRR", "Irregularly irregular", "Systolic murmur", "Diastolic murmur", "CTAB", "Crackles at bases", "Wheezing", "Diminished breath sounds", "Subclavian CL (Single)", "Subclavian CL (Double)", "Subclavian CL (Triple)"],
  "Abdomen & GI/GU": ["Soft/NT/ND", "Tender to palpation", "Distended", "NABS", "Hyperactive BS", "Firm", "Guarding", "Rebound"],
  "GU & Pelvis": ["Foley catheter", "Straight cath", "Suprapubic cath", "Hematuria", "Incontinent", "Pelvic binder"],
  "Left Arm": ["24g PIV", "22g PIV", "20g PIV", "18g PIV", "16g PIV", "14g PIV", "Midline", "PICC line", "Radial pulse 2+", "Arterial line"],
  "Right Arm": ["24g PIV", "22g PIV", "20g PIV", "18g PIV", "16g PIV", "14g PIV", "Midline", "PICC line", "Radial pulse 2+", "Dialysis access"],
  "Left Leg": ["No edema", "1+ pitting edema", "2+ pitting edema", "3+ pitting edema", "Warm/Well perfused", "Dorsalis pedis 2+", "Compression stockings"],
  "Right Leg": ["No edema", "1+ pitting edema", "2+ pitting edema", "3+ pitting edema", "Warm/Well perfused", "Dorsalis pedis 2+", "Foot ulcer"],
};

const GAUGE_THEMES: Record<string, { active: string; inactive: string }> = {
  "14g": { 
    active: "bg-orange-600 border-orange-500 shadow-orange-900/40 ring-orange-400/50", 
    inactive: "border-orange-500/30 text-orange-400/70 hover:bg-orange-500/10 hover:text-orange-300"
  },
  "16g": { 
    active: "bg-stone-500 border-stone-400 shadow-stone-900/40 ring-stone-300/50", 
    inactive: "border-stone-500/30 text-stone-400/70 hover:bg-stone-500/10 hover:text-stone-300"
  },
  "18g": { 
    active: "bg-emerald-600 border-emerald-500 shadow-emerald-900/40 ring-emerald-400/50", 
    inactive: "border-emerald-500/30 text-emerald-400/70 hover:bg-emerald-500/10 hover:text-emerald-300"
  },
  "20g": { 
    active: "bg-pink-600 border-pink-500 shadow-pink-900/40 ring-pink-400/50", 
    inactive: "border-pink-500/30 text-pink-400/70 hover:bg-pink-500/10 hover:text-pink-300"
  },
  "22g": { 
    active: "bg-blue-600 border-blue-500 shadow-blue-900/40 ring-blue-400/50", 
    inactive: "border-blue-500/30 text-blue-400/70 hover:bg-blue-500/10 hover:text-blue-300"
  },
  "24g": { 
    active: "bg-yellow-600 border-yellow-500 shadow-yellow-900/40 ring-yellow-400/50", 
    inactive: "border-yellow-500/30 text-yellow-400/70 hover:bg-yellow-500/10 hover:text-yellow-300"
  }
};

export function ExamTab({ patient, updatePatient }: { patient: Patient; updatePatient: (id: string, data: Partial<Patient>) => void }) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [newFinding, setNewFinding] = useState("");
  const [severity, setSeverity] = useState<ExamFinding["severity"]>("normal");

  const sectionMap: Record<string, string> = {
    "Head & Neuro": "NEUR",
    "Chest & CV/Pulm": "CV/RESP",
    "Abdomen & GI/GU": "ABD",
    "GU & Pelvis": "GU",
    "Left Arm": "TUBES/LINES",
    "Right Arm": "TUBES/LINES",
    "Left Leg": "CV", 
    "Right Leg": "CV",
  };

  const getSectionForFinding = (part: string, text: string) => {
    const t = text.toLowerCase();
    
    if (t.includes("pulse")) return "CV";
    if (t.includes("piv") || t.includes("line") || t.includes("midline") || t.includes("cath") || t.includes("tube") || t.includes("access")) return "TUBES/LINES";

    if (part === "Chest & CV/Pulm") {
      if (t.includes("breath") || t.includes("lung") || t.includes("crackles") || t.includes("wheez") || t.includes("ctab") || t.includes("effort")) return "RESP";
      return "CV";
    }
    if (part === "Head & Neuro") {
      if (t.includes("ao") || t.includes("alert") || t.includes("orient") || t.includes("affect")) return "GEN";
      return "NEUR";
    }
    return sectionMap[part] || "SKIN";
  };

  const isFindingActive = (text: string) => {
    return patient.examNote.toLowerCase().includes(text.toLowerCase());
  };

  const toggleFinding = (findingValue: string) => {
    if (!selectedPart) return;
    const text = findingValue.trim();
    const sectionPrefix = getSectionForFinding(selectedPart, text);
    
    let updatedNote = patient.examNote;
    const lines = updatedNote.split("\n");
    const sectionIndex = lines.findIndex(l => l.startsWith(sectionPrefix + ":"));
    
    if (sectionIndex === -1) return;

    let line = lines[sectionIndex];
    const isActive = isFindingActive(text);

    if (isActive) {
      const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`,?\\s?${escapedText}(\\s?\\(\\w+\\))?`, 'gi');
      line = line.replace(regex, "").trim();
      
      line = line.replace(/:\s?,/, ": ").replace(/,\s*,/g, ",").replace(/,\s*$/, "").replace(/\s+/g, " ");
      if (line === sectionPrefix + ":" || line.trim() === sectionPrefix + ":") line = sectionPrefix + ": _";
    } else {
      if (text.toLowerCase().includes("edema") && !text.toLowerCase().includes("no edema")) {
        line = line.replace(/no peripheral edema/gi, "").replace(/no edema/gi, "");
      }
      if (text.toLowerCase().includes("crackles") || text.toLowerCase().includes("wheez") || text.toLowerCase().includes("diminished")) {
        line = line.replace(/lung fields ctab/gi, "").replace(/ctab/gi, "");
      }
      if (text.toLowerCase().includes("tender") || text.toLowerCase().includes("distend") || text.toLowerCase().includes("firm")) {
        line = line.replace(/soft, nontender, no hepatosplenomegaly/gi, "").replace(/soft/gi, "").replace(/nontender/gi, "");
      }
      if (text.toLowerCase().includes("ao") || text.toLowerCase().includes("alert")) {
        line = line.replace(/AOx\d/gi, "").replace(/oriented to self, date, place/gi, "").replace(/alert/gi, "");
      }

      line = line.replace(/,?\s?_$/, "").trim();
      const lastChar = line.slice(-1);
      if (!line.endsWith(":") && lastChar !== ",") line += ",";
      
      line += ` ${text}${severity !== "normal" ? ` (${severity})` : ""}`;
    }

    lines[sectionIndex] = line;
    updatePatient(patient.id, { examNote: lines.join("\n") });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFinding.trim()) {
      toggleFinding(newFinding);
      setNewFinding("");
    }
  };

  const removeFinding = (id: string) => {
    updatePatient(patient.id, { examFindings: patient.examFindings.filter(f => f.id !== id) });
  };

  const severityColors = {
    normal: "bg-stone-800 text-stone-300 border-stone-700",
    mild: "bg-blue-900/30 text-blue-300 border-blue-900/50",
    moderate: "bg-amber-900/30 text-amber-300 border-amber-900/50",
    severe: "bg-red-900/30 text-red-300 border-red-900/50",
  };

  return (
    <div className="relative h-full flex flex-col overflow-hidden min-h-[600px]">
      {/* Mannequin Section - Takes most of the height */}
      <div className={`flex-1 transition-all duration-700 ease-in-out flex flex-col items-center justify-center p-6 ${selectedPart ? "pb-4 scale-90 lg:scale-100" : "scale-100 lg:scale-125"}`}>
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <h3 className="text-[10px] font-bold text-stone-600 mb-8 uppercase tracking-[0.2em]">Clinical Mannequin Entry</h3>
          <div className="transition-transform duration-500">
            <MannequinSVG onSelectPart={setSelectedPart} />
          </div>
          
          <div className="mt-8 text-center h-8">
            {!selectedPart && (
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest animate-pulse">
                Tap a body part to begin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating/Bottom Options Panel */}
      {selectedPart && (
        <div className="fixed inset-x-0 bottom-0 z-30 p-2 lg:p-6 animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-5xl mx-auto bg-stone-900/90 backdrop-blur-2xl border border-stone-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 lg:p-6 border-b border-stone-800/50 flex items-center justify-between bg-stone-950/20">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                <h3 className="font-black text-white text-base uppercase tracking-tight">
                  {selectedPart} <span className="text-stone-600 font-medium lowercase ml-1 italic tracking-normal">(tap to toggle)</span>
                </h3>
              </div>
              <button 
                onClick={() => setSelectedPart(null)}
                className="p-2 hover:bg-stone-800 rounded-xl text-stone-500 hover:text-white transition-all border border-transparent hover:border-stone-700 group"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[40vh] no-scrollbar">
              <div className="flex flex-wrap gap-2 pb-2">
                {EXAM_TEMPLATES[selectedPart]?.map(template => {
                  const active = isFindingActive(template);
                  const gaugeMatch = template.toLowerCase().match(/(\d{2}g)/);
                  const gauge = gaugeMatch ? gaugeMatch[1] : null;
                  const theme = gauge ? GAUGE_THEMES[gauge] : null;

                  return (
                    <button
                      key={template}
                      onClick={() => toggleFinding(template)}
                      className={`text-[11px] font-bold uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-sm border ${
                        active 
                          ? (theme?.active || "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40 ring-1 ring-blue-400/50") 
                          : (theme?.inactive || "bg-stone-950 border-stone-800 text-stone-500 hover:bg-stone-800 hover:text-stone-300")
                      }`}
                    >
                      {template}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-stone-800/50">
                <input
                  type="text"
                  value={newFinding}
                  onChange={(e) => setNewFinding(e.target.value)}
                  placeholder="Custom entry..."
                  className="flex-1 border border-stone-800 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-stone-950 text-white placeholder:text-stone-800 shadow-inner"
                />
                <div className="flex gap-2">
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as ExamFinding["severity"])}
                    className={`border border-stone-800 rounded-xl px-4 py-4 text-[10px] font-black uppercase tracking-wider bg-stone-950 appearance-none min-w-[120px] text-center transition-colors ${severity !== 'normal' ? 'text-blue-400 border-blue-900/30' : 'text-stone-500'}`}
                  >
                    <option value="normal">Normal</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <button 
                    type="submit" 
                    disabled={!newFinding.trim()}
                    className="bg-stone-100 text-stone-950 px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white disabled:opacity-30 transition-all shadow-xl active:scale-95"
                  >
                    Apply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mini Summary at bottom left */}
      {!selectedPart && patient.examFindings.length > 0 && (
        <div className="absolute bottom-6 left-6 scale-90 origin-bottom-left max-w-xs opacity-50 hover:opacity-100 transition-opacity">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 flex flex-col gap-2">
               <h4 className="text-[8px] font-bold text-stone-500 uppercase tracking-widest mb-1">Recent Data</h4>
               {patient.examFindings.slice(-3).map(f => (
                  <div key={f.id} className="text-[10px] text-stone-400 truncate">
                     {f.bodyPart}: {f.finding}
                  </div>
               ))}
            </div>
        </div>
      )}
    </div>
  );
}
