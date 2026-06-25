"use server";

import { db } from "@/db";
import { aiUsage } from "@/db/schema";
import { ValidationError } from "@/types/errors";
import cuid from "cuid";
import { z } from "zod";

const getDaysSinceEpoch = () => Math.floor(Date.now() / (24 * 60 * 60 * 1000));

const recordUsageSchema = z.object({
  modelId: z.string(),
  promptTokens: z.number().min(0).default(0),
  completionTokens: z.number().min(0).default(0),
});

export async function recordAIUsage(input: {
  modelId: string;
  promptTokens?: number;
  completionTokens?: number;
}) {
  const validation = recordUsageSchema.safeParse(input);
  if (!validation.success) {
    throw new ValidationError("Invalid usage data", validation.error.format());
  }

  const { promptTokens, completionTokens, modelId } = validation.data;

  const [insertedUsage] = await db
    .insert(aiUsage)
    .values({
      id: cuid(),
      modelId,
      promptTokens: promptTokens.toString(),
      completionTokens: completionTokens.toString(),
      daysSinceEpoch: getDaysSinceEpoch().toString(),
      createdAt: new Date(),
    })
    .returning();

  return insertedUsage;
}