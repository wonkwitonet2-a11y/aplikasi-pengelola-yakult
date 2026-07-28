import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
    const res = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: "Hello"
    });
    console.log("3.6-flash OK:", res.text);
  } catch(e) {
    console.error("3.6-flash failed:", e.message);
  }
}
test();
