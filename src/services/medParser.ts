import { Medication } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Parses medication lists from clipboard format.
 * Expects lines like:
 * metoprolol (metoprolol tartrate 25 mg oral tablet)
 * 12.5 mg, 0.5 Tab, bid
 */
export function parseMedicationsScript(text: string): Medication[] {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const medications: Medication[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is a category header (like "CARDIOVASCULAR" or "COAG/HEMATOLOGY")
    // These are usually ALL CAPS
    if (/^[A-Z\/\s]{3,}$/.test(line)) continue;

    // Check if line is a medication name line
    // Often starts with a generic name then paren brand name
    // Example: metoprolol (metoprolol tartrate 25 mg oral tablet)
    // Example: amLODIPine
    if (line && !line.includes(',') && !line.includes(' mg') && !line.includes(' units')) {
      const name = line.split('(')[0].trim();
      
      // Look at the next line for dose/freq
      const detailLine = lines[i + 1];
      if (detailLine && (detailLine.includes(',') || detailLine.includes(' mg') || detailLine.includes(' units'))) {
        const parts = detailLine.split(',').map(p => p.trim());
        
        // Dose is usually first
        const dose = parts[0];
        
        // Freq is often last or second to last
        // Logic: look for common frequencies or check the end
        const freq = parts.length > 2 ? parts[parts.length - 1] : (parts[1] || "");
        
        // Route
        const routeRaw = parts.find(p => ['PO', 'IV', 'SC', 'IM', 'SL', 'PR', 'eye', 'topical', 'peritoneal'].some(r => p.toLowerCase().includes(r.toLowerCase())));
        const route = routeRaw || "";

        medications.push({
          id: uuidv4(),
          name,
          dose,
          frequency: freq,
          route,
          flag: "none"
        });
        
        i++; // Skip the detail line
      } else {
        // Fallback if no detail line matches
        medications.push({
          id: uuidv4(),
          name,
          flag: "none"
        });
      }
    }
  }

  return medications;
}
