"use server";

import { z } from "zod";
import { db } from "@/db";
import { theme as themeTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import cuid from "cuid";
import { themeStylesSchema, type ThemeStyles } from "@/types/theme";
import { cache } from "react";
import {
  ValidationError,
  ThemeNotFoundError,
} from "@/types/errors";
import { logError } from "@/lib/shared";

const createThemeSchema = z.object({
  name: z.string().min(1, "Theme name cannot be empty").max(50, "Theme name too long"),
  styles: themeStylesSchema,
});

const updateThemeSchema = z.object({
  id: z.string().min(1, "Theme ID required"),
  name: z.string().min(1, "Theme name cannot be empty").max(50, "Theme name too long").optional(),
  styles: themeStylesSchema.optional(),
});

export async function getThemes() {
  try {
    return await db
      .select({
        id: themeTable.id,
        name: themeTable.name,
        styles: themeTable.styles,
        createdAt: themeTable.createdAt,
        updatedAt: themeTable.updatedAt,
      })
      .from(themeTable);
  } catch (error) {
    logError(error as Error, { action: "getThemes" });
    throw error;
  }
}

export const getTheme = cache(async (themeId: string) => {
  try {
    if (!themeId) {
      throw new ValidationError("Theme ID required");
    }

    const [theme] = await db.select().from(themeTable).where(eq(themeTable.id, themeId)).limit(1);

    if (!theme) {
      throw new ThemeNotFoundError();
    }

    return theme;
  } catch (error) {
    logError(error as Error, { action: "getTheme", themeId });
    throw error;
  }
});

export async function createTheme(formData: { name: string; styles: ThemeStyles }) {
  try {
    const validation = createThemeSchema.safeParse(formData);
    if (!validation.success) {
      throw new ValidationError("Invalid input", validation.error.format());
    }

    const { name, styles } = validation.data;
    const newThemeId = cuid();
    const now = new Date();

    const [insertedTheme] = await db
      .insert(themeTable)
      .values({
        id: newThemeId,
        name: name,
        styles: styles,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return insertedTheme;
  } catch (error) {
    logError(error as Error, { action: "createTheme", formData: { name: formData.name } });
    throw error;
  }
}

export async function updateTheme(formData: { id: string; name?: string; styles?: ThemeStyles }) {
  try {
    const validation = updateThemeSchema.safeParse(formData);
    if (!validation.success) {
      throw new ValidationError("Invalid input", validation.error.format());
    }

    const { id: themeId, name, styles } = validation.data;

    if (!name && !styles) {
      throw new ValidationError("No update data provided");
    }

    const updateData: Partial<typeof themeTable.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (name) updateData.name = name;
    if (styles) updateData.styles = styles;

    const [updatedTheme] = await db
      .update(themeTable)
      .set(updateData)
      .where(eq(themeTable.id, themeId))
      .returning();

    if (!updatedTheme) {
      throw new ThemeNotFoundError("Theme not found");
    }

    return updatedTheme;
  } catch (error) {
    logError(error as Error, { action: "updateTheme", themeId: formData.id });
    throw error;
  }
}

export async function deleteTheme(themeId: string) {
  try {
    if (!themeId) {
      throw new ValidationError("Theme ID required");
    }

    const [deletedTheme] = await db
      .delete(themeTable)
      .where(eq(themeTable.id, themeId))
      .returning({ id: themeTable.id, name: themeTable.name });

    if (!deletedTheme) {
      throw new ThemeNotFoundError("Theme not found");
    }

    return deletedTheme;
  } catch (error) {
    logError(error as Error, { action: "deleteTheme", themeId });
    throw error;
  }
}