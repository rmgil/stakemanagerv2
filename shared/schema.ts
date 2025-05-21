import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tournament categories enum
export const TournamentCategory = {
  PHASE_DAY_1: "PHASE_DAY_1",
  PHASE_DAY_2_PLUS: "PHASE_DAY_2_PLUS",
  OTHER_CURRENCY: "OTHER_CURRENCY",
  OTHER_TOURNAMENTS: "OTHER_TOURNAMENTS",
} as const;

export type TournamentCategoryType = typeof TournamentCategory[keyof typeof TournamentCategory];

// Tournament schema
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  tournamentId: text("tournament_id"),
  buyIn: real("buy_in").notNull(),
  buyInOriginal: text("buy_in_original"),
  reEntries: integer("re_entries").default(0),
  totalEntries: integer("total_entries").default(1),
  totalBuyIn: real("total_buy_in"),
  result: real("result").notNull(),
  normalDeal: real("normal_deal").notNull(),
  automaticSale: real("automatic_sale").notNull(),
  currencyCode: text("currency_code").default("USD"),
  conversionRate: real("conversion_rate").default(1),
  uploadBatchId: text("upload_batch_id").notNull(),
  originalFilename: text("original_filename"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

// Upload batches schema
export const uploadBatches = pgTable("upload_batches", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalTournaments: integer("total_tournaments").notNull(),
  netProfit: real("net_profit").notNull(),
  normalDeal: real("normal_deal").notNull(),
  automaticSale: real("automatic_sale").notNull(),
  submittedToPolarize: boolean("submitted_to_polarize").default(false),
  polarizeSessionId: text("polarize_session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUploadBatchSchema = createInsertSchema(uploadBatches).omit({
  createdAt: true,
});

export type InsertUploadBatch = z.infer<typeof insertUploadBatchSchema>;
export type UploadBatch = typeof uploadBatches.$inferSelect;

// Player level schema types
export const playerLevelSchema = z.object({
  level: z.string(),
  levelProgress: z.number(),
  levelProgressFormatted: z.string().optional(),
  levelProgressPercentage: z.number().optional(),
  normalLimit: z.number(), // cap_normal para torneios regulares (em USD)
  phaseLimit: z.number(),  // cap_phase para torneios Phase (em USD)
  // Compatibilidade com implementação anterior para testes
  maxTotalBuyin: z.number().optional(),
  maxTournamentBuyin: z.number().optional(),
  normalDealPercentage: z.number().optional(),
  automaticSalePercentage: z.number().optional(),
});

export type PlayerLevel = z.infer<typeof playerLevelSchema>;

// Tournament summary and calculated results
export const tournamentResultSchema = z.object({
  name: z.string(),
  tournamentId: z.string().optional(),
  category: z.string(),
  buyIn: z.number(),
  buyInOriginal: z.string().optional(),
  reEntries: z.number().default(0),
  totalEntries: z.number().default(1),
  totalBuyIn: z.number().optional(),
  result: z.number(),
  normalDeal: z.number(),
  automaticSale: z.number(),
  currencyCode: z.string().default("USD"),
  conversionRate: z.number().default(1),
  originalFilename: z.string().optional(),
});

export type TournamentResult = z.infer<typeof tournamentResultSchema>;

// Summary results schema
export const summaryResultSchema = z.object({
  totalTournaments: z.number(),
  netProfit: z.number(),
  normalDeal: z.number(),
  automaticSale: z.number(),
  categories: z.object({
    phaseDay1Count: z.number(),
    phaseDay2Count: z.number(),
    otherCurrencyCount: z.number(),
    otherTournamentsCount: z.number(),
    phaseDay1Percentage: z.number(),
    phaseDay2Percentage: z.number(),
    otherCurrencyPercentage: z.number(),
    otherTournamentsPercentage: z.number(),
  }),
});

export type SummaryResult = z.infer<typeof summaryResultSchema>;

// API response schemas
export const polarizePlayerResponse = z.object({
  level: z.string(),
  progress: z.number(),
  limits: z.object({
    normal: z.number(),
    phase: z.number(),
  }),
});

export type PolarizePlayerResponse = z.infer<typeof polarizePlayerResponse>;
