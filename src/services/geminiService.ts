import { GoogleGenAI } from "@google/genai";
import { Medication, Patient } from "../types";
import { v4 as uuidv4 } from "uuid";

// Initialize the Gemini AI client
// process.env.GEMINI_API_KEY is replaced at compile time by Vite
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseMedicationsSequence(text: string): Promise<Medication[]> {
  try {
    const prompt = `You are a medical assistant parsing medication lists or clinical dictation.
Extract all medications mentioned in the text below.
Respond with a JSON array where each object has these fields exactly:
- "name": string (the medication name)
- "dose": string (dosage amount, e.g., "50mg", leave empty if not found)
- "frequency": string (frequency, e.g., "BID", "daily", leave empty if not found)
- "route": string (e.g., "PO", "IV", leave empty if not found)

Do not include any other text besides the raw JSON array.

Text to parse:
"""
${text}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
          responseMimeType: "application/json",
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed)) {
        return parsed.map((m: any) => ({
          id: uuidv4(),
          name: m.name || "Unknown Med",
          dose: m.dose || "",
          frequency: m.frequency || "",
          route: m.route || "",
          flag: "none",
        }));
      }
    }
    return [];
  } catch (error) {
    console.error("Failed to parse medications:", error);
    throw new Error("Failed to parse medications. Please try again.");
  }
}
