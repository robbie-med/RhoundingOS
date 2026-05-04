/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PatientProvider, usePatients } from "./context/PatientContext";
import { Sidebar } from "./components/Sidebar";
import { PatientDashboard } from "./components/PatientDashboard";
import { PrintView } from "./components/PrintView";
import { Menu, X } from "lucide-react";

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { patients, activePatientId } = usePatients();
  
  const activePatient = patients.find(p => p.id === activePatientId);

  return (
    <div className="flex h-screen w-full bg-stone-950 font-sans text-stone-200 overflow-hidden print:bg-white print:h-auto print:overflow-visible">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-stone-900 border-b border-stone-800 z-50 px-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-sm font-bold text-stone-500 uppercase tracking-widest">RoundingOS</h1>
          {activePatient && (
            <span className="text-stone-100 font-semibold truncate max-w-[200px]">
              {activePatient.name}
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 hover:bg-stone-800 rounded-lg transition-colors border border-stone-800"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <div className="flex w-full h-full pt-16 lg:pt-0 print:hidden relative">
        {/* Sidebar overlay for mobile */}
        <div className={`
          fixed inset-0 bg-black/70 z-40 transition-opacity lg:hidden
          ${isSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `} onClick={() => setIsSidebarOpen(false)} />
        
        <div className={`
          fixed lg:relative inset-y-0 left-0 z-40 w-80 transform transition-transform duration-300 lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <Sidebar onSelect={() => setIsSidebarOpen(false)} />
        </div>

        <PatientDashboard />
      </div>
      <PrintView />
    </div>
  );
}

export default function App() {
  return (
    <PatientProvider>
      <AppContent />
    </PatientProvider>
  );
}
