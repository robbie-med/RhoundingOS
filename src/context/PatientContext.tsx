import React, { createContext, useContext, useEffect, useState } from "react";
import { Patient, DEFAULT_CHECKLIST } from "../types";
import { v4 as uuidv4 } from "uuid";

interface PatientContextType {
  patients: Patient[];
  activePatientId: string | null;
  setActivePatientId: (id: string | null) => void;
  addPatient: (data: Partial<Patient>) => void;
  updatePatient: (id: string, data: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: React.ReactNode }) {
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const stored = localStorage.getItem("rounding-patients");
      if (stored) {
        // Hydrate dates properly if needed
        const parsed = JSON.parse(stored);
        return parsed.map((p: any) => ({
          ...p,
          problems: p.problems || [],
          misc: p.misc || {
            o2: "",
            codeStatus: "",
            giPpx: "",
            bowelPpx: "",
            dvtPpx: "",
            dispo: "",
            dpoa: "",
            diet: ""
          }
        }));
      }
    } catch (e) {
      console.error("Failed to parse patients from local storage", e);
    }
    return [];
  });

  const [activePatientId, setActivePatientId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("rounding-patients", JSON.stringify(patients));
  }, [patients]);

  const addPatient = (data: Partial<Patient>) => {
    if (patients.length >= 10) {
      alert("You have reached the maximum of 10 patients.");
      return;
    }
    const newPatient: Patient = {
      id: uuidv4(),
      name: data.name || "Unknown Patient",
      room: data.room || "TBD",
      age: data.age || 0,
      gender: data.gender || "Unknown",
      diagnosis: data.diagnosis || "",
      oneLiner: data.oneLiner || "",
      vitalsLabs: data.vitalsLabs || "",
      problemList: data.problemList || "",
      examNote: data.examNote || `GEN: iNAD, awakes to voice, alert, oriented to self, date, place
CV: RRR, nmrg, no peripheral edema
RESP: lung fields CTAB, normal respiratory effort
ABD: soft, nontender, no hepatosplenomegaly, NABS
GU: _
SKIN: warm, soft, intact, no rash
NEUR: CN II-XII grossly intact, grossly normal strength and sensation in both extremities
TUBES/LINES: _`,
      checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c, id: uuidv4() })),
      examFindings: [],
      medications: [],
      problems: [],
      misc: {
        o2: "",
        codeStatus: "",
        giPpx: "",
        bowelPpx: "",
        dvtPpx: "",
        dispo: "",
        dpoa: "",
        diet: ""
      }
    };
    setPatients((prev) => [...prev, newPatient]);
    setActivePatientId(newPatient.id);
  };

  const updatePatient = (id: string, data: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p))
    );
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (activePatientId === id) {
      setActivePatientId(null);
    }
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        activePatientId,
        setActivePatientId,
        addPatient,
        updatePatient,
        deletePatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error("usePatients must be used within a PatientProvider");
  }
  return context;
}
