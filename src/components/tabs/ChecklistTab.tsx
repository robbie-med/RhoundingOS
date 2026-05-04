import React, { useState } from "react";
import { Patient, ChecklistItem } from "../../types";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export function ChecklistTab({ patient, updatePatient }: { patient: Patient; updatePatient: (id: string, data: Partial<Patient>) => void }) {
  const [newTask, setNewTask] = useState("");

  const toggleChecklist = (itemId: string) => {
    const updated = patient.checklist.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    updatePatient(patient.id, { checklist: updated });
  };

  const removeTask = (id: string) => {
    updatePatient(patient.id, { checklist: patient.checklist.filter(i => i.id !== id) });
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const item: ChecklistItem = {
      id: uuidv4(),
      text: newTask.trim(),
      completed: false,
      isStandard: false,
      createdAt: Date.now()
    };
    updatePatient(patient.id, { checklist: [...patient.checklist, item] });
    setNewTask("");
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-stone-500 uppercase tracking-widest">Rounding Checklist & Tasks</h2>
      </div>

      <form onSubmit={addTask} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a custom rounding task or sign-out item..."
          className="flex-1 border border-stone-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-stone-950 text-white placeholder:text-stone-700"
        />
        <button type="submit" disabled={!newTask.trim()} className="bg-stone-100 text-stone-950 px-4 py-2 rounded-lg hover:bg-white disabled:opacity-50 flex items-center gap-2 text-sm font-bold transition-all shadow-lg">
          <Plus className="h-4 w-4" /> Add Task
        </button>
      </form>

      <div className="space-y-1">
        {patient.checklist.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <button
              onClick={() => toggleChecklist(item.id)}
              className={`flex-1 flex items-center gap-3 p-3 rounded-lg transition-all text-left border ${
                item.completed 
                  ? "bg-emerald-950/20 border-emerald-900/50 shadow-inner" 
                  : "hover:bg-stone-800/50 border-transparent hover:border-stone-800"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-stone-700 shrink-0" />
              )}
              <span className={`text-sm tracking-tight transition-colors ${item.completed ? "text-emerald-500/70 line-through" : "text-stone-300"} ${!item.isStandard ? "font-medium" : ""}`}>
                {item.text}
              </span>
            </button>
            {!item.isStandard && (
              <button 
                onClick={() => removeTask(item.id)} 
                className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
