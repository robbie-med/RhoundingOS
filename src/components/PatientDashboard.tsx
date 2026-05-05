import React, { useState } from "react";
import { usePatients } from "../context/PatientContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/Tabs";
import { ChecklistTab } from "./tabs/ChecklistTab";
import { MedicationsTab } from "./tabs/MedicationsTab";
import { ExamTab } from "./tabs/ExamTab";
import { NotesTab } from "./tabs/NotesTab";
import { LabsTab } from "./tabs/LabsTab";
import { ChevronDown, ChevronUp } from "lucide-react";

export function PatientDashboard() {
  const { patients, activePatientId, updatePatient } = usePatients();
  const [activeTab, setActiveTab] = useState("checklist");
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

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
      <div className={`transition-all duration-300 ease-in-out shrink-0 bg-stone-900 shadow-lg border-b border-stone-800 z-10 ${isExamMode ? "h-0 opacity-0 overflow-hidden" : ""}`}>
        <header className="px-4 lg:px-8 py-3">
          <div 
            className="flex justify-between items-center cursor-pointer group"
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          >
            <div>
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors">{activePatient.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                <span className="flex items-center gap-1.5"><span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">Room:</span> <span className="text-stone-200">{activePatient.room}</span></span>
                <span className="flex items-center gap-1.5"><span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">Age/Sex:</span> <span className="text-stone-200">{activePatient.age || "?"}{activePatient.gender ? activePatient.gender.charAt(0) : ""}</span></span>
                <span className="flex items-center gap-1.5"><span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">Diagnosis:</span> <span className="text-stone-200 underline decoration-stone-700 underline-offset-4">{activePatient.diagnosis || "Unspecified"}</span></span>
              </div>
            </div>
            <button className="p-2 text-stone-500 hover:text-white transition-colors">
              {isHeaderExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>

          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isHeaderExpanded ? "max-h-[200px] mt-4 opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Patient One-Liner & Course</label>
              <textarea
                className="w-full text-xs resize-none border-stone-800 border rounded-xl p-2 bg-stone-950 text-stone-200 focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-stone-700"
                rows={2}
                placeholder="e.g. 72yo M w/ PMHx of CHF presenting with acute exacerbation..."
                value={activePatient.oneLiner}
                onChange={(e) => updatePatient(activePatient.id, { oneLiner: e.target.value })}
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
                <TabsTrigger value="labs" className="shrink-0">Labs & Vitals</TabsTrigger>
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

            <TabsContent value="labs" className="outline-none">
              <LabsTab patient={activePatient} />
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
