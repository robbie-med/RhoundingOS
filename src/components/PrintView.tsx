import React from "react";
import { usePatients } from "../context/PatientContext";

export function PrintView() {
  const { patients } = usePatients();
  
  return (
    <div className="hidden print:block w-full p-6 font-sans text-xs">
      <div className="flex items-center justify-between mb-6 border-b border-black pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Patient Rounding List</h1>
        <span className="font-medium text-sm">{new Date().toLocaleDateString()}</span>
      </div>
      
      <div className="flex flex-col gap-6">
        {patients.map(p => (
          <div key={p.id} className="border border-stone-400 p-3 rounded-lg page-break-inside-avoid">
            {/* Header */}
            <div className="flex justify-between font-bold text-sm border-b border-stone-300 pb-2 mb-2 bg-stone-100 px-2 py-1 -mx-2 -mt-2 rounded-t flex-wrap">
              <span className="text-base">{p.room} • {p.name}</span>
              <span className="text-stone-600">{p.age || "?"}{p.gender ? p.gender.charAt(0) : "U"} | {p.diagnosis || "No Dx"}</span>
            </div>
             
             {/* One-Liner */}
             <div className="mb-3">
               <span className="font-semibold uppercase tracking-wider text-[10px] text-stone-500 block mb-0.5">One-Liner / Hospital Course</span>
               <p className="italic text-stone-800">{p.oneLiner || "________________________________________________"}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                {/* To-Dos & Meds */}
                <div>
                  <div className="font-semibold uppercase tracking-wider text-[10px] text-stone-500 mb-1">Checklist & Tasks</div>
                  <ul className="list-none space-y-1">
                    {p.checklist.map(t => (
                        <li key={t.id} className="flex gap-2">
                           <span className={`border border-stone-800 w-3 h-3 inline-block rounded-sm mt-0.5 flex-shrink-0 ${t.completed ? 'bg-stone-300' : ''}`}></span>
                           <span className={`${t.completed ? 'line-through text-stone-500' : ''}`}>{t.text}</span>
                        </li>
                    ))}
                  </ul>

                  {p.medications.filter(m => m.flag !== "none").length > 0 && (
                     <div className="mt-2">
                       <span className="font-semibold uppercase text-red-600 tracking-wider text-[10px] mb-1 block">Flagged Meds</span>
                       <ul className="list-disc pl-4 space-y-0.5">
                         {p.medications.filter(m => m.flag !== "none").map(m => (
                           <li key={m.id} className="font-bold">{m.name} - {m.flag.toUpperCase()}</li>
                         ))}
                       </ul>
                     </div>
                  )}
                </div>

                {/* Vitals / Labs Scratchpad Space */}
                <div>
                  <div className="font-semibold uppercase tracking-wider text-[10px] text-stone-500 mb-1">Morning Labs & Vitals</div>
                  {p.vitalsLabs ? (
                     <div className="whitespace-pre-wrap text-stone-800 border rounded p-1.5 bg-stone-50 min-h-[60px]">{p.vitalsLabs}</div>
                  ) : (
                    <div className="border border-dashed border-stone-300 rounded h-20 w-full"></div>
                  )}
                </div>
             </div>
          </div>
        ))}

        {patients.length === 0 && (
           <p className="text-center italic text-stone-500">No patients added to rounding list.</p>
        )}
      </div>
    </div>
  );
}
