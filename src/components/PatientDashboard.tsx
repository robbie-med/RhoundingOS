import React from "react";
import { usePatients } from "../context/PatientContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { ChecklistTab } from "./tabs/ChecklistTab";
import { MedicationsTab } from "./tabs/MedicationsTab";
import { ExamTab } from "./tabs/ExamTab";
import { NotesTab } from "./tabs/NotesTab";

export function PatientDashboard() {
  const { patients, activePatientId, updatePatient } = usePatients();
  const [activeTab, setActiveTab] = React.useState("checklist");

  const activePatient = patients.find((p) => p.id === activePatientId);

  if (!activePatient) {
    return (
      <div className="flex-1 bg-stone-950 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-800">
             <span className="text-stone-700 text-2xl font-bold">OS</span>
          </div>
          <h2 className="text-xl font-medium text-stone-600">No Patient Selected</h2>
          <p className="text-stone-700 mt-2 text-sm italic">Select or add a patient from the sidebar to begin rounding.</p>
        </div>
      </div>
    );
  }

  const isExamMode = activeTab === "exam";

  return (
    <div className="flex-1 flex flex-col h-full bg-stone-900 overflow-hidden relative">
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExamMode ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"}`}>
        <header className="px-4 lg:px-8 py-4 lg:py-6 border-b border-stone-800 bg-stone-900 shrink-0 shadow-lg shadow-black/20 z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{activePatient.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs lg:text-sm text-stone-400">
                <span className="flex items-center gap-1.5"><span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">Room:</span> <span className="text-stone-200">{activePatient.room}</span></span>
                <span className="flex items-center gap-1.5"><span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">Age/Sex:</span> <span className="text-stone-200">{activePatient.age || "?"}{activePatient.gender ? activePatient.gender.charAt(0) : ""}</span></span>
                <span className="flex items-center gap-1.5"><span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">Diagnosis:</span> <span className="text-stone-200 underline decoration-stone-700 underline-offset-4">{activePatient.diagnosis || "Unspecified"}</span></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] lg:text-xs font-bold text-stone-500 uppercase tracking-widest">Patient One-Liner & Course</label>
              <textarea
                className="w-full text-xs lg:text-sm resize-none border-stone-800 border rounded-xl p-2 lg:p-3 bg-stone-950 text-stone-200 focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-stone-700"
                rows={2}
                placeholder="e.g. 72yo M w/ PMHx of CHF presenting with acute exacerbation..."
                value={activePatient.oneLiner}
                onChange={(e) => updatePatient(activePatient.id, { oneLiner: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] lg:text-xs font-bold text-stone-500 uppercase tracking-widest">Morning Labs & Vitals</label>
              <textarea
                className="w-full text-[10px] lg:text-xs resize-none border-stone-800 border rounded-xl p-2 lg:p-3 bg-stone-950 text-stone-300 font-mono focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-stone-700"
                rows={2}
                placeholder="Tmax 37.8, HR 80s | Na 135 K 4.0 Cr 1.1"
                value={activePatient.vitalsLabs}
                onChange={(e) => updatePatient(activePatient.id, { vitalsLabs: e.target.value })}
              />
            </div>
          </div>
        </header>
      </div>

      <div className={`flex-1 overflow-auto transition-all duration-500 ${isExamMode ? "p-0" : "p-4 lg:p-8"}`}>
        <div className={`max-w-5xl mx-auto h-full flex flex-col ${isExamMode ? "max-w-none" : ""}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <div className={`${isExamMode ? "px-4 py-2 bg-stone-950 border-b border-stone-800" : ""}`}>
              <TabsList className="mb-6 lg:mb-8 w-full justify-start overflow-x-auto no-scrollbar pb-1">
                <TabsTrigger value="checklist" className="shrink-0">Checklist & Tasks</TabsTrigger>
                <TabsTrigger value="medications" className="shrink-0">Medications</TabsTrigger>
                <TabsTrigger value="exam" className="shrink-0">Exam (Mannequin)</TabsTrigger>
                <TabsTrigger value="notes" className="shrink-0">A&P / Note Builder</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="checklist" className="outline-none">
              <ChecklistTab patient={activePatient} updatePatient={updatePatient} />
            </TabsContent>
            
            <TabsContent value="medications" className="outline-none">
              <MedicationsTab patient={activePatient} updatePatient={updatePatient} />
            </TabsContent>

            <TabsContent value="exam" className="outline-none flex-1">
              <ExamTab patient={activePatient} updatePatient={updatePatient} />
            </TabsContent>

            <TabsContent value="notes" className="outline-none">
              <NotesTab patient={activePatient} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
