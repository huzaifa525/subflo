import OpenAI from "openai";
import { prisma } from "../db";

// DB first, ENV as expert override fallback
export async function getUserLLMConfig(userId: string) {
  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  return {
    baseUrl: settings?.llmBaseUrl || process.env.LLM_BASE_URL || "http://localhost:11434/v1",
    apiKey: settings?.llmApiKey || process.env.LLM_API_KEY || "ollama",
    model: settings?.llmModel || process.env.LLM_MODEL || "llama3.1:8b",
  };
}

export async function callLLM(
  prompt: string,
  systemPrompt: string = "You are a helpful assistant.",
  jsonMode: boolean = true,
  userId?: string
): Promise<string> {
  const config = userId
    ? await getUserLLMConfig(userId)
    : {
        baseUrl: process.env.LLM_BASE_URL || "http://localhost:11434/v1",
        apiKey: process.env.LLM_API_KEY || "ollama",
        model: process.env.LLM_MODEL || "llama3.1:8b",
      };

  const client = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey || "ollama" });

  const response = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    ...(jsonMode && { response_format: { type: "json_object" } }),
  });

  return response.choices[0]?.message?.content || "";
}

export async function extractJSON<T>(prompt: string, systemPrompt: string, userId?: string): Promise<T> {
  const raw = await callLLM(prompt, systemPrompt, true, userId);
  try {
    return JSON.parse(raw) as T;
  } catch {
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1]) as T;
    throw new Error(`Failed to parse LLM response as JSON: ${raw.slice(0, 200)}`);
  }
}

export async function fetchModels(baseUrl: string, apiKey: string): Promise<{ id: string; name: string }[]> {
  try {
    const client = new OpenAI({ baseURL: baseUrl, apiKey: apiKey || "ollama" });
    const response = await client.models.list();
    const models: { id: string; name: string }[] = [];
    for await (const model of response) {
      models.push({ id: model.id, name: model.id });
    }
    return models.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}
