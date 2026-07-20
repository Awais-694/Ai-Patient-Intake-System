import Groq from "groq-sdk";

let client;

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  if (!client) {
    client = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 30000,
      maxRetries: 1,
    });
  }

  return client;
}

export const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-20b";
