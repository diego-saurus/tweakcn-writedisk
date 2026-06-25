import { ThemeStyles } from "@/types/theme";
import {
  pgTable,
  json,
  timestamp,
  text,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

export const theme = pgTable("theme", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  styles: json("styles").$type<ThemeStyles>().notNull(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const aiUsage = pgTable("ai_usage", {
  id: text("id").primaryKey(),
  modelId: text("model_id").notNull(),
  promptTokens: text("prompt_tokens").notNull().default("0"),
  completionTokens: text("completion_tokens").notNull().default("0"),
  daysSinceEpoch: text("days_since_epoch").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

// Community themes are no longer supported in the local fork.
// These tables are kept as no-ops (empty) so existing imports do not break,
// but no data is written to them.

export const communityTheme = pgTable(
  "community_theme",
  {
    id: text("id").primaryKey(),
    themeId: text("theme_id").unique(),
    publishedAt: timestamp("published_at").notNull(),
    likeCount: text("like_count").notNull().default("0"),
  },
  (table) => [
    index("community_theme_published_at_idx").on(table.publishedAt),
  ]
);

export const communityThemeTag = pgTable(
  "community_theme_tag",
  {
    communityThemeId: text("community_theme_id")
      .notNull()
      .references(() => communityTheme.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.communityThemeId, table.tag] }),
    index("community_theme_tag_tag_idx").on(table.tag),
  ]
);