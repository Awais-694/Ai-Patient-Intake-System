import { z } from "zod";

import { auth } from "@/lib/auth";
import { API_MESSAGES } from "@/lib/constants";
import { analyzeSymptoms } from "@/services/ai.service";

export const runtime = "nodejs";

const requestSchema = z.object({
  symptoms: z
    .string()
    .trim()
    .min(10, "Symptoms must contain at least 10 characters.")
    .max(2000, "Symptoms cannot exceed 2000 characters."),
  duration: z.string().trim().max(100).optional().default(""),
  additionalInformation: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .default(""),
  consentToAIAnalysis: z.literal(true, {
    errorMap: () => ({
      message: "Consent is required before AI analysis.",
    }),
  }),
});

export async function POST(request) {
  const session = await auth();

  if (!session?.user) {
    return Response.json(
      { success: false, message: API_MESSAGES.UNAUTHORIZED },
      { status: 401 }
    );
  }

  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return Response.json(
      {
        success: false,
        message: API_MESSAGES.VALIDATION_ERROR,
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeSymptoms(parsed.data);
    return Response.json({ success: true, data: analysis });
  } catch (error) {
    console.error("Groq symptom analysis failed:", error);
    return Response.json(
      {
        success: false,
        message: "The symptom analysis could not be completed.",
      },
      { status: 502 }
    );
  }
}
