# RoundingOS: Professional Clinical Workflow System

RoundingOS is a high-performance, tablet-optimized web application designed for inpatient clinicians (residents, attending physicians, and medical students). It bridges the gap between raw medical data and high-quality clinical documentation through an interactive, "Assessment-First" workflow.

## 🚀 Key Features

- **PWA / Offline First**: Installable on iOS/Android. Includes a "Forced Offline" toggle to guarantee zero data requests during rounds.
- **Interactive A&P (Assessment & Plan)**: A button-centric UI where clinical problems act as containers for differentials, medications, and orders.
- **Clinical Mannequin**: A visual touch-interface for standardizing physical exam findings.
- **Dynamic Note Generation**: Real-time conversion of interactive data into standard medical note formatting (Impression/Plan, DDx, Plan).
- **Medication Linking**: Drag-and-drop medications from a patient's master list directly into specific problem containers to organize life-saving therapy.

---

## 🛠 Project Logic & Data Structure

The application state is centralized in `PatientContext.tsx` using a custom provider that persists data to `localStorage`.

### 1. Adding & Managing Problems
The **Notes (A&P)** tab is the heart of the app. 
- **Template Library**: Use the "Hamburger" menu in the top right of the Notes tab to select from 14+ pre-populated clinical templates (e.g., DKA, COPD Exacerbation, Sepsis).
- **Custom Problems**: Click **+ Add Problem** to create a blank container.
- **Dynamic DDx**: Each problem has "Sub-containers" for Differential Diagnosis. Click the **+** icon in the DDx section to add an entry (formatted as `>Item` in the note).
- **Status Toggles**: Every problem identifies its current state: `NEW`, `STABLE`, `IMPROVING`, or `WORSENING`. This determines the header in the generated note.

### 2. Management & Medications
Management happens through two paths:
- **Drag-and-Drop**: Medications added in the **Medications** tab appear in the "Available Meds" sidebar. Drag these into a problem container to "link" that treatment to its rationale.
- **Inline Entry**: Click the **+** in the "Management" section of a Problem container to add a new med or test. This automatically creates a global medication entry, adds it to the master list, and links it to the current problem simultaneously.
- **Real-time Edits**: Changing a dose or frequency on a linked card in the problem container updates that medication across the entire app.

### 3. Physical Exam Findings
Located in the **Exam** tab:
- **The Mannequin**: Select a body part (e.g., Lungs, Heart) to open a contextual entry panel.
- **Templates**: Tap a template (e.g., "Regular Rate & Rhythm") to instantly add it.
- **Severity Toggles**: Set findings as Normal, Mild, Moderate, or Severe to color-code the clinical data.
- **Manual Overlay**: Use the text input for ad-hoc findings like "3cm laceration at distal mid-shin."

### 4. Checklist & System Tasks
The **Checklist** tab uses a relational tracking system for standard rounding tasks (e.g., "Check Cultures," "Review CXR"). These are separated into:
- **Pending Actions**: Tasks currently in progress.
- **Completed (Auto-clearing)**: Tasks completed during the current round.

---

## 🏥 Clinical Note Logic

The bottom of the **Notes** tab features a "Copy Note" function. The generation logic follows this hierarchy:
1. **Header**: Demographics and One-liner.
2. **Impression & Plan**:
   - Problem Header (`# Problem Title (STATUS)`)
   - Assessment text
   - Formatted DDx (`>Differentials`)
   - Formatted Plan (`- Medications, - Tests, - Orders`)
3. **Unassigned Meds**: Any medication not explicitly linked to a problem is grouped at the bottom to ensure safety and catch potential errors.
4. **Physical Exam**: A standardized output of the findings recorded in the Mannequin.

---

## 🔌 Technical Implementation Notes

- **Drag and Drop**: Built with `@dnd-kit/core`, utilizing a `PointerSensor` with a distance threshold to prevent accidental drags while scrolling.
- **Persistence**: Data is serialized to JSON and stored under the `rounding-os-patients` key.
- **Service Worker**: Uses a `Stale-While-Revalidate` strategy to ensure immediate loading while updating assets in the background.

## 📝 Customizing Templates
To add new default problems or medications, modify the `PROBLEM_TEMPLATES` constant in `src/components/tabs/NotesTab.tsx`. Each template supports `title`, `assessment`, `ddx`, and a `medications` array (name, dose, frequency).
