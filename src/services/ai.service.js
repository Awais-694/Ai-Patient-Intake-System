import { GROQ_MODEL, getGroqClient } from "@/lib/groq";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";

export async function analyzeSymptoms({
  symptoms,
  duration = "",
  additionalInformation = "",
}) {
  const completion = await getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.1,
    max_completion_tokens: 1600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You support clinical intake and do not diagnose. Understand symptoms written in English, Urdu, or Roman Urdu, including mixed-language and informal phrasing. Normalize the patient's meaning into clear professional English without inventing facts. Return valid JSON with keys summary (string), reportedSymptoms (string array), missingInformation (string array), redFlagsDetected (string array), requiresUrgentReview (boolean), suggestedDepartment (string). Advise emergency care for obvious red flags. The summary, arrays, and suggested department must be written in professional English.",
      },
      {
        role: "user",
        content: JSON.stringify({
          symptoms,
          duration,
          additionalInformation,
        }),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Groq returned an empty symptom analysis.");
  }

  const result = parseJsonResponse(content);

  return {
    summary: String(result.summary || "").trim(),
    reportedSymptoms: normalizeStringArray(result.reportedSymptoms),
    missingInformation: normalizeStringArray(result.missingInformation),
    redFlagsDetected: normalizeStringArray(result.redFlagsDetected),
    requiresUrgentReview: Boolean(result.requiresUrgentReview),
    suggestedDepartment: String(
      result.suggestedDepartment || ""
    ).trim(),
    disclaimer: MEDICAL_DISCLAIMER,
    provider: "groq",
    modelName: GROQ_MODEL,
  };
}

function parseJsonResponse(content) {
  const cleaned = String(content)
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("Groq returned an invalid JSON analysis.");
  }
}

function normalizeStringArray(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item).trim()).filter(Boolean)
    : [];
}
