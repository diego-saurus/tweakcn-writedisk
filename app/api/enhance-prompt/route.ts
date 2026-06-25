import { ENHANCE_PROMPT_SYSTEM } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { handleError } from "@/lib/error-response";
import { NextRequest } from "next/server";
import { streamText } from "ai";

export async function POST(req: NextRequest) {
  try {
    const { prompt }: { prompt: string } = await req.json();

    if (!prompt?.trim()) {
      return new Response("Prompt is required", { status: 400 });
    }

    const result = streamText({
      model: myProvider.languageModel("prompt-enhancement"),
      system: ENHANCE_PROMPT_SYSTEM,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return handleError(error, { route: "/api/enhance-prompt" });
  }
}