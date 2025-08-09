import { streamText } from "ai";
import { AI_MODELS, type AIModelKey } from "@/lib/ai/vercel-client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { prompt, model = "gpt-4o-mini", systemMessage } = await req.json();

    // Get the model instance
    const modelInstance = AI_MODELS[model as AIModelKey] || AI_MODELS["gpt-4o-mini"];

    // Prepare messages
    const messages = [{ role: "user" as const, content: prompt }];

    // Generate streaming response
    const result = await streamText({
      model: modelInstance,
      ...(systemMessage && { system: systemMessage }),
      messages,
      maxOutputTokens: 4000,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Completion API error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
