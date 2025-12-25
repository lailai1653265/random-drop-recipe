
import { GoogleGenAI } from "@google/genai";

export const generatePackDescription = async (seed: string, packName: string): Promise<string> => {
  // Always initialize GoogleGenAI inside the service function to ensure it uses the most up-to-date API_KEY.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a fun, short Minecraft 1.21.10 Data Pack description for a randomizer pack named "${packName}" with seed "${seed}". Keep it under 100 characters.`,
    });
    // Extracting text from GenerateContentResponse using the .text property as per guidelines.
    return response.text || "A chaotic randomizer for Minecraft 1.21.10";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Randomizer Data Pack - Seed: ${seed}`;
  }
};
