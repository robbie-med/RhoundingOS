import React, { useState, useMemo } from 'react';
import { Patient } from '../../types';
import { usePatients } from '../../context/PatientContext';
import { 
  Activity, 
  Beaker, 
  ChevronDown, 
  ChevronRight, 
  Clipboard, 
  Delete, 
  Keyboard, 
  Plus,
  Trash2,
  X
} from 'lucide-react';

interface ParsedItem {
  name: string;
  value: string;
  time?: string;
  prevValue?: string;
  prevTime?: string;
  range?: string;
}

interface LabGroup {
  name: string;
  items: ParsedItem[];
}

export function LabsTab({ patient }: { patient: Patient }) {
  const { updatePatient } = usePatients();
  const [isPasting, setIsPasting] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [selectedLab, setSelectedLab] = useState<string | null>(null);
  const [rapidValue, setRapidValue] = useState("");

  const commonLabs = [
    { label: "Na", color: "bg-blue-500/10 text-blue-400" },
    { label: "K", color: "bg-emerald-500/10 text-emerald-400" },
    { label: "Cl", color: "bg-stone-500/10 text-stone-300" },
    { label: "CO2", color: "bg-stone-500/10 text-stone-300" },
    { label: "BUN", color: "bg-orange-500/10 text-orange-400" },
    { label: "Cr", color: "bg-orange-500/10 text-orange-400" },
    { label: "Glu", color: "bg-stone-500/10 text-stone-300" },
    { label: "Ca", color: "bg-yellow-500/10 text-yellow-500" },
    { label: "Mg", color: "bg-blue-400/10 text-blue-300" },
    { label: "Phos", color: "bg-stone-500/10 text-stone-300" },
    { label: "WBC", color: "bg-stone-200/10 text-stone-200" },
    { label: "Hgb", color: "bg-rose-500/10 text-rose-400" },
    { label: "Hct", color: "bg-rose-500/10 text-rose-400" },
    { label: "Plt", color: "bg-stone-500/10 text-stone-300" },
    { label: "INR", color: "bg-amber-500/10 text-amber-500" },
    { label: "Trop", color: "bg-rose-600/10 text-rose-500" },
    { label: "BNP", color: "bg-cyan-500/10 text-cyan-400" },
    { label: "Lac", color: "bg-stone-500/10 text-stone-300" },
  ];

  // Robust parser for the clinical copy-paste format
  const parsedData = useMemo(() => {
    if (!patient.labsNote) return [];
    
    const lines = patient.labsNote.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const groups: LabGroup[] = [];
    let currentGroup: LabGroup | null = null;
    
    const sectionHeaders = ["Vitals", "Labs", "CBC", "BMP", "LFT", "eGFR", "Blood group", "Other", "Latest", "Previous", "Last 72h"];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip generic labels that aren't data headers
        if (["LATEST", "PREVIOUS", "LAST 72H", "MOST RECENT"].includes(line.toUpperCase())) continue;

        // Check if line is a header
        if (sectionHeaders.some(h => line.toUpperCase() === h.toUpperCase() || line.startsWith(h))) {
            // If it's something like "WBC 10^9/L", it's an item, not a group unless it's one of the big headers
            const bigHeaders = ["Vitals", "Labs", "CBC", "BMP", "LFT", "eGFR", "Blood group", "Other"];
            if (bigHeaders.some(h => line.toUpperCase() === h.toUpperCase())) {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = { name: line, items: [] };
                continue;
            }
        }

        if (!currentGroup) {
            currentGroup = { name: "Extracted Info", items: [] };
        }

        const nextLine = lines[i+1];
        if (nextLine && (nextLine.includes('•') || /^[0-9.><]/.test(nextLine))) {
            const name = line;
            let value = "";
            let time: string | undefined;
            let prevValue: string | undefined;
            let prevTime: string | undefined;
            let range: string | undefined;

            let offset = 1;
            
            // 1. Process Latest
            const latestLine = lines[i + offset];
            if (latestLine && latestLine.includes('•')) {
                const parts = latestLine.split('•');
                value = parts[0].trim();
                time = parts[1].replace(/[››]/g, '').trim();
                offset++;
            } else if (latestLine) {
                value = latestLine;
                offset++;
            }

            // 2. Process Previous
            const previousLine = lines[i + offset];
            if (previousLine && previousLine.includes('•')) {
                const parts = previousLine.split('•');
                prevValue = parts[0].trim();
                prevTime = parts[1].replace(/[››]/g, '').trim();
                offset++;
            }

            // 3. Process Meta (Range / 72h summary)
            const metaLine = lines[i + offset];
            if (metaLine && (metaLine.includes('-') || metaLine.includes('Series') || /^[0-9.]/.test(metaLine))) {
                range = metaLine;
                offset++;
            }

            currentGroup.items.push({ name, value, time, prevValue, prevTime, range });
            i += (offset - 1);
        }
    }
    
    if (currentGroup) groups.push(currentGroup);
    return groups;
  }, [patient.labsNote]);

  const handlePasteSave = () => {
    updatePatient(patient.id, { labsNote: pasteContent });
    setIsPasting(false);
  };

  const handleRapidInput = (val: string) => {
    if (val === "CLR") {
        setRapidValue("");
    } else if (val === "DEL") {
        setRapidValue(prev => prev.slice(0, -1));
    } else if (val === ".") {
        if (!rapidValue.includes(".")) setRapidValue(prev => prev + ".");
    } else {
        setRapidValue(prev => prev + val);
    }
  };

  const addRapidLab = () => {
    if (!selectedLab || !rapidValue) return;
    const entry = `\n${selectedLab}\n${rapidValue} • NOW\n`;
    updatePatient(patient.id, { labsNote: (patient.labsNote || "") + entry });
    setRapidValue("");
    setSelectedLab(null);
  };

  return (
    <div className="p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-stone-800">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
              <Beaker className="h-8 w-8 text-blue-500" /> Labs & Vitals
            </h2>
            <p className="text-stone-500 text-sm font-medium mt-1 uppercase tracking-widest">Diagnostic data aggregation</p>
          </div>
          
          <button 
            onClick={() => setIsPasting(!isPasting)}
            className={`px-8 py-4 rounded-3xl font-black uppercase text-xs tracking-widest transition-all flex items-center gap-3 ${
              isPasting ? "bg-stone-800 text-white" : "bg-blue-600 text-white shadow-xl shadow-blue-900/40 hover:bg-blue-500"
            }`}
          >
            <Clipboard className="h-4 w-4" /> {isPasting ? "Close Panel" : "Paste Clinical Data"}
          </button>
        </div>

        {/* PASTE PANEL */}
        {isPasting && (
          <div className="bg-stone-900 border border-stone-800 rounded-[40px] p-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-stone-300 uppercase tracking-widest">Paste Data from EMR</h3>
              <button onClick={() => setPasteContent("")} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400">Clear All</button>
            </div>
            <textarea
              className="w-full h-64 bg-stone-950 border border-stone-800 rounded-3xl p-6 text-xs text-stone-400 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none transition-all placeholder:text-stone-800"
              placeholder="Paste vitals and labs here..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
            />
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handlePasteSave}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-3xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-emerald-950"
              >
                Save & Parse Data
              </button>
            </div>
          </div>
        )}

        {/* DATA DISPLAY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* PARSED VALUES */}
          <div className="lg:col-span-12 space-y-12">
            {parsedData.length === 0 ? (
              <div className="bg-stone-900/30 border-2 border-dashed border-stone-800 rounded-[40px] p-20 text-center">
                <Beaker className="h-12 w-12 text-stone-800 mx-auto mb-4" />
                <p className="text-stone-600 font-bold uppercase tracking-widest text-sm">No data parsed. Paste clinical info to begin.</p>
              </div>
            ) : (
              <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                {parsedData.map((group, gIdx) => (
                  <div key={gIdx} className="break-inside-avoid bg-stone-900/50 border border-stone-800 rounded-[32px] overflow-hidden flex flex-col shadow-lg">
                    <div className="px-6 py-4 bg-stone-800/30 border-b border-stone-800 flex items-center justify-between">
                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{group.name}</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <div className="p-4 space-y-1">
                      {group.items.map((item, iIdx) => (
                        <div key={iIdx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-stone-800/50 transition-all border border-transparent hover:border-stone-800 group">
                           <div className="flex flex-col max-w-[55%]">
                             <span className="text-[10px] font-black text-stone-500 uppercase tracking-tight truncate group-hover:text-stone-400">{item.name}</span>
                             <span className="text-[9px] font-medium text-stone-600 italic">{item.time}</span>
                           </div>
                           <div className="text-right flex items-center gap-4">
                             {item.prevValue && (
                                <div className="flex flex-col items-end opacity-40 group-hover:opacity-60 transition-opacity">
                                    <span className="text-[11px] font-bold text-stone-500 line-through decoration-stone-600">{item.prevValue}</span>
                                    <span className="text-[8px] font-bold text-stone-700 uppercase tracking-tighter">{item.prevTime}</span>
                                </div>
                             )}
                             <div className="flex flex-col items-end">
                                <div className="text-sm font-black text-white group-hover:text-blue-400 transition-colors uppercase">{item.value}</div>
                                {item.range && (
                                  <div className="text-[9px] font-bold text-stone-700 uppercase tracking-tighter truncate max-w-[80px]">{item.range}</div>
                                )}
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RAPID ENTRY SECTION */}
          <div className="lg:col-span-12">
            <div className="bg-stone-900/80 border border-stone-800 rounded-[40px] p-6 lg:p-8 mt-4 shadow-2xl backdrop-blur-xl">
               <div className="flex items-center gap-3 mb-6">
                  <Keyboard className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg lg:text-xl font-black text-white uppercase tracking-tight text-glow-emerald">Rapid Lab Entry</h3>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12">
                  {/* LAB SELECTOR */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest border-b border-stone-800 pb-2">Select Lab</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {commonLabs.map((lab) => (
                          <button
                            key={lab.label}
                            onClick={() => setSelectedLab(lab.label)}
                            className={`p-2 lg:p-3 rounded-xl lg:rounded-2xl font-black uppercase text-[10px] lg:text-xs transition-all border ${
                                selectedLab === lab.label 
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950 border-emerald-500 scale-105" 
                                : `${lab.color} border-transparent hover:border-stone-700`
                            }`}
                          >
                            {lab.label}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* KEYPAD */}
                  <div className="bg-stone-950/50 border border-stone-800 rounded-[24px] lg:rounded-[32px] p-4 lg:p-6 flex flex-col gap-4 lg:gap-6">
                    <div className="flex items-center justify-between px-2 lg:px-4">
                        <div className="flex flex-col">
                             <span className="text-[9px] lg:text-[10px] font-black text-stone-600 uppercase tracking-widest">Entry Value</span>
                             <span className="text-2xl lg:text-3xl font-black text-white tracking-widest min-h-[36px] lg:min-h-[40px]">
                                {selectedLab ? `${selectedLab} ${rapidValue}` : "SELECT LAB"}
                             </span>
                        </div>
                        {rapidValue && (
                             <button onClick={() => setRapidValue("")} className="p-2 lg:p-3 bg-rose-500/10 text-rose-500 rounded-full hover:bg-rose-500/20 transition-all">
                                <X className="h-4 w-4" />
                             </button>
                        )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 lg:gap-3">
                        {[1,2,3,4,5,6,7,8,9,'.',0,'CLR'].map((num) => (
                           <button
                             key={num}
                             onClick={() => handleRapidInput(num.toString())}
                             className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-stone-900 border border-stone-800 text-white font-black text-lg lg:text-xl hover:bg-stone-800 active:scale-95 transition-all shadow-inner"
                           >
                             {num}
                           </button>
                        ))}
                        <button 
                             onClick={() => handleRapidInput("DEL")}
                             className="col-span-1 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-stone-900 border border-stone-800 text-rose-500 flex items-center justify-center hover:bg-stone-800"
                        >
                            <Delete className="h-5 w-5 lg:h-6 lg:w-6" />
                        </button>
                        <button 
                             onClick={addRapidLab}
                             disabled={!selectedLab || !rapidValue}
                             className="col-span-2 h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-emerald-600 text-white font-black text-xs lg:text-sm uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-20 disabled:grayscale transition-all shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 lg:gap-3"
                        >
                            <Plus className="h-4 w-4 lg:h-5 lg:w-5" /> Append Entry
                        </button>
                    </div>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
