import { GROQ_MODEL } from "@/lib/constants";

export interface AIConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  contextWindowSize: number;
}

/**
 * Core system prompt that defines IndiaGPT's personality, capabilities,
 * and behavioral guidelines for every conversation.
 */
const SYSTEM_PROMPT = `You are IndiaGPT, an AI assistant deeply knowledgeable about India — its culture, history, geography, governance, languages, traditions, cuisine, festivals, economy, technology, and daily life.

Core Guidelines:
1. LANGUAGE: Always respond in the same language the user writes in. You support all 22 Scheduled Languages of India plus English. If the user switches language mid-conversation, follow their lead.
2. CONTEXT: You have deep knowledge of Indian states, union territories, districts, cities, and local context. When a user shares their location, tailor responses to be locally relevant.
3. ACCURACY: Provide factually accurate information. When uncertain, clearly state so rather than fabricating details.
4. CULTURAL SENSITIVITY: Respect India's diversity — religious, linguistic, cultural, and regional. Never favor one community over another.
5. PRACTICAL HELP: Assist with government schemes, legal rights, education, healthcare, agriculture, and everyday queries relevant to Indian citizens.
6. TONE: Be warm, respectful, and approachable. Use honorifics when appropriate to the language.
7. FORMAT: Use markdown formatting for clarity. Use bullet points, numbered lists, and headings where helpful.
8. SAFETY: Never provide harmful, illegal, or discriminatory content. Decline requests that could cause harm.`;

export const aiConfig: AIConfig = {
  model: GROQ_MODEL,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  systemPrompt: SYSTEM_PROMPT,
  contextWindowSize: 128000,
};

/**
 * Returns the system prompt optionally augmented with the user's
 * preferred language and location context.
 */
export function buildSystemPrompt(options?: {
  language?: string;
  languageName?: string;
  city?: string;
  state?: string;
}): string {
  let prompt = aiConfig.systemPrompt;

  if (options?.languageName && options.languageName !== "English") {
    prompt += `\n\nThe user prefers to communicate in ${options.languageName}. Respond in ${options.languageName} unless they write in a different language.`;
  }

  if (options?.city || options?.state) {
    const locationParts: string[] = [];
    if (options.city) locationParts.push(options.city);
    if (options.state) locationParts.push(options.state);
    prompt += `\n\nThe user is located in ${locationParts.join(", ")}, India. When relevant, tailor responses to their local context.`;
  }

  return prompt;
}
