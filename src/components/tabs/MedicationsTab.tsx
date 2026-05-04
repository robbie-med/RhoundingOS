import React, { useState } from "react";
import { Patient, Medication } from "../../types";
import { parseMedicationsScript } from "../../services/medParser";
import { Clipboard, Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export function MedicationsTab({ patient, updatePatient }: { patient: Patient; updatePatient: (id: string, data: Partial<Patient>) => void }) {
  const [inputText, setInputText] = useState("");

  const handleParse = () => {
    if (!inputText.trim()) return;
    const parsedMeds = parseMedicationsScript(inputText);
    updatePatient(patient.id, { medications: [...patient.medications, ...parsedMeds] });
    setInputText("");
  };

  const updateMedFlag = (medId: string, newFlag: Medication["flag"]) => {
    const med = patient.medications.find(m => m.id === medId);
    if (!med) return;

    // Automagically add a list item if flagging
    if (newFlag !== "none" && med.flag === "none") {
      const actionText = newFlag === "stop" ? "Stop" : newFlag === "hold" ? "Hold" : "Change dose for";
      const todoText = `${actionText} ${med.name} ${med.dose || ""}`.trim();
      
      const newChecklistItem = {
        id: uuidv4(),
        text: todoText,
        completed: false,
        isStandard: false,
        createdAt: Date.now()
      };
      
      const updatedMeds = patient.medications.map(m => m.id === medId ? { ...m, flag: newFlag } : m);
      updatePatient(patient.id, { 
        medications: updatedMeds,
        checklist: [...patient.checklist, newChecklistItem]
      });
    } else {
      const updatedMeds = patient.medications.map(m => m.id === medId ? { ...m, flag: newFlag } : m);
      updatePatient(patient.id, { medications: updatedMeds });
    }
  };

  const removeMed = (medId: string) => {
    updatePatient(patient.id, { medications: patient.medications.filter(m => m.id !== medId) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Current Medications</h2>
          </div>
          
          <div className="space-y-3">
            {patient.medications.length === 0 ? (
              <p className="text-sm text-stone-600 italic py-8 text-center font-mono">No medications recorded.</p>
            ) : (
              patient.medications.map((med) => (
                <div key={med.id} className={`flex items-center justify-between p-4 border rounded-xl shadow-sm transition-all ${med.flag !== "none" ? "border-amber-900/50 bg-amber-950/20" : "border-stone-800 bg-stone-950"}`}>
                  <div className="flex-1">
                    <h3 className={`font-medium ${med.flag !== "none" ? "text-amber-200" : "text-stone-100"}`}>{med.name}</h3>
                    <p className="text-sm text-stone-500">{[med.dose, med.route, med.frequency].filter(Boolean).join(" • ")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex p-0.5 bg-stone-900 border border-stone-800 rounded-lg">
                      {[
                        { id: "none", label: "No", color: "text-stone-500", activeColor: "bg-stone-800 text-stone-200" },
                        { id: "dose_change", label: "Δ", color: "text-amber-600", activeColor: "bg-amber-600 text-white shadow-lg" },
                        { id: "hold", label: "HOLD", color: "text-orange-600", activeColor: "bg-orange-600 text-white shadow-lg" },
                        { id: "stop", label: "STOP", color: "text-red-600", activeColor: "bg-red-600 text-white shadow-lg" }
                      ].map((flag) => (
                        <button
                          key={flag.id}
                          onClick={() => updateMedFlag(med.id, flag.id as Medication["flag"])}
                          className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded transition-all min-w-[32px] md:min-w-[48px] ${
                            med.flag === flag.id ? flag.activeColor : `${flag.color} hover:bg-stone-800/50`
                          }`}
                        >
                          {flag.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => removeMed(med.id)} className="p-2 text-stone-600 hover:text-red-400 hover:bg-stone-800 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-stone-600" />
              Import Meds
            </h3>
          </div>
          <p className="text-xs text-stone-500 mb-4 italic">
            Copy-paste the medication list directly from the EMR.
          </p>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-64 p-3 text-[10px] border border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none bg-stone-950 font-mono text-stone-300 placeholder:text-stone-800"
            placeholder="NAME NAME • #######&#10;CARDIOVASCULAR&#10;metoprolol ...&#10;12.5 mg, 0.5 Tab, bid..."
          />
          <button
            onClick={handleParse}
            disabled={!inputText.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-950 py-3 rounded-lg font-bold text-sm hover:bg-white disabled:opacity-50 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Parse & Add Meds
          </button>
        </div>
      </div>
    </div>
  );
}
