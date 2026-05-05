export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  isStandard?: boolean; //distinguish default from added tasks
  createdAt?: number;
}

export interface ExamFinding {
  id: string;
  bodyPart: string;
  finding: string;
  severity: "mild" | "moderate" | "severe" | "normal";
}

export interface Medication {
  id: string;
  name: string;
  dose?: string;
  frequency?: string;
  route?: string;
  flag: "none" | "stop" | "hold" | "dose_change";
  noteAction?: "CONT" | "HOLD" | "CHANGE";
  noteNewDose?: string;
}

export interface Problem {
  id: string;
  title: string;
  status: "new" | "stable" | "improving" | "worsening";
  assessment: string;
  ddx: string[];
  medicationIds: string[];
  tests: string[];
  orders: string;
}

export interface MiscInfo {
  o2: string;
  codeStatus: string;
  giPpx: string;
  bowelPpx: string;
  dvtPpx: string;
  dispo: string;
  dpoa: string;
  diet: string;
}

export interface Patient {
  id: string;
  name: string;
  room: string;
  age: number;
  gender: string;
  diagnosis: string;
  oneLiner: string;
  vitalsLabs: string;
  problemList: string;
  examNote: string;
  checklist: ChecklistItem[];
  examFindings: ExamFinding[];
  medications: Medication[];
  problems: Problem[];
  misc?: MiscInfo;
  vitalsNote?: string;
  labsNote?: string;
  overnightEvents?: string;
  hospitalCourse?: string;
}

export const DEFAULT_CHECKLIST: Omit<ChecklistItem, "id">[] = [
  { text: "Review Events / Vitals / IOs", completed: false, isStandard: true },
  { text: "Check Morning Labs / Imaging", completed: false, isStandard: true },
  { text: "Pre-Round (Nursing/Pt)", completed: false, isStandard: true },
  { text: "Discuss w/ Senior/Attending", completed: false, isStandard: true },
  { text: "Order Rounds Meds/Labs", completed: false, isStandard: true },
  { text: "Progress Note Signed", completed: false, isStandard: true },
  { text: "Handoff / IPASS Updated", completed: false, isStandard: true },
];
