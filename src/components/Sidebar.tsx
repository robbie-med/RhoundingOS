import React, { useState } from "react";
import { UserPlus, UserCircle, Trash2, Printer, Shield, ShieldOff } from "lucide-react";
import { usePatients } from "../context/PatientContext";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "./ui/Dialog";

export function Sidebar({ onSelect }: { onSelect?: () => void }) {
  const { patients, activePatientId, setActivePatientId, addPatient, deletePatient } = usePatients();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(() => localStorage.getItem("forced-offline") === "true");
  const [newPatient, setNewPatient] = useState({ name: "", room: "", age: "", gender: "Male", diagnosis: "" });

  const toggleOffline = () => {
    const next = !isOfflineMode;
    setIsOfflineMode(next);
    localStorage.setItem("forced-offline", String(next));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;
    addPatient({ ...newPatient, age: parseInt(newPatient.age) || 0 });
    setNewPatient({ name: "", room: "", age: "", gender: "Male", diagnosis: "" });
    setIsAddOpen(false);
    onSelect?.();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex-shrink-0 border-r border-stone-800 bg-stone-900 flex flex-col h-full">
      <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">RoundingOS</h1>
          <p className="text-sm text-stone-500">{patients.length}/10 Patients</p>
        </div>
        <button 
          onClick={handlePrint}
          className="p-2 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
          title="Print Pocket Card"
        >
          <Printer className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
        {patients.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setActivePatientId(p.id);
              onSelect?.();
            }}
            className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
              activePatientId === p.id
                ? "bg-stone-800 border-blue-900 shadow-lg ring-1 ring-blue-500/50"
                : "bg-stone-900 border-stone-800 hover:border-stone-700 hover:bg-stone-800"
            }`}
          >
            <UserCircle className={`h-10 w-10 shrink-0 ${activePatientId === p.id ? "text-blue-400" : "text-stone-600"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <h3 className={`font-medium truncate ${activePatientId === p.id ? "text-white" : "text-stone-300"}`}>
                  {p.name}
                </h3>
                <span className="text-[10px] font-mono text-stone-400 bg-stone-950 border border-stone-800 px-1.5 py-0.5 rounded leading-none">
                  {p.room}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">{p.diagnosis || "No diagnosis set"}</p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Remove patient?")) deletePatient(p.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-500 hover:text-red-400 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        {patients.length === 0 && (
          <div className="text-center py-8 text-stone-600 text-sm italic">
            No patients listed. Add a patient to begin rounding.
          </div>
        )}
      </div>

      <div className="p-4 bg-stone-950 border-t border-stone-800 space-y-3">
        <button
          onClick={toggleOffline}
          className={`w-full flex items-center justify-between gap-2 rounded-lg py-2 px-3 text-[10px] font-bold uppercase tracking-widest transition-all border ${
            isOfflineMode 
              ? "bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
              : "bg-stone-900/50 border-stone-800 text-stone-500 hover:text-stone-400"
          }`}
        >
          <div className="flex items-center gap-2">
            {isOfflineMode ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3 opacity-50" />}
            <span>{isOfflineMode ? "Forced Offline Active" : "Assume Internet"}</span>
          </div>
          <div className={`w-6 h-3 rounded-full relative transition-colors ${isOfflineMode ? "bg-amber-500" : "bg-stone-800"}`}>
             <div className={`absolute top-0.5 w-2 h-2 rounded-full bg-white transition-all ${isOfflineMode ? "left-3.5" : "left-0.5"}`} />
          </div>
        </button>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <button
              disabled={patients.length >= 10}
              className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-950 rounded-lg py-2.5 px-4 font-bold text-sm hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
            >
              <UserPlus className="h-4 w-4" />
              Add Patient
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-stone-100">Add New Patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4 text-stone-100">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Patient Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Age</label>
                  <input
                    type="number"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. 72"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Gender</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600 appearance-none"
                  >
                    <option value="Male" className="bg-stone-900">Male</option>
                    <option value="Female" className="bg-stone-900">Female</option>
                    <option value="Other" className="bg-stone-900">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Room</label>
                  <input
                    type="text"
                    value={newPatient.room}
                    onChange={(e) => setNewPatient({ ...newPatient, room: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. 402B"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Diagnosis</label>
                  <input
                    type="text"
                    value={newPatient.diagnosis}
                    onChange={(e) => setNewPatient({ ...newPatient, diagnosis: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 text-white rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="e.g. Pneumonia"
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 text-white rounded-lg py-3 font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">
                  Save Patient
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
