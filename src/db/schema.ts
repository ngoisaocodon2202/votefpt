import {
  pgTable,
  uuid,
  varchar,
  text,
  date,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const candidates = pgTable("candidates", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  dob: date("dob", { mode: "string" }).notNull(),
  studentId: varchar("student_id", { length: 50 }).notNull().unique(),
  major: varchar("major", { length: 150 }).notNull(),
  avatarUrl: text("avatar_url").notNull(),
  bio: text("bio"),
  voteCount: integer("vote_count").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const votes = pgTable(
  "votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id").references(() => candidates.id, {
      onDelete: "cascade",
    }),
    votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow(),
    voteDate: date("vote_date", { mode: "string" }).default(sql`CURRENT_DATE`),
  },
  (table) => [index("idx_user_daily_votes").on(table.userId, table.voteDate)]
);

export const newsArticles = pgTable("news_articles", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  campus: varchar("campus", { length: 120 }).notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: jsonb("content").$type<string[]>().notNull(),
  publishedAt: varchar("published_at", { length: 50 }).notNull(),
  readTime: varchar("read_time", { length: 50 }).notNull(),
  imageUrl: text("image_url").notNull(),
  featured: boolean("featured").default(false).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const uploadedMedia = pgTable("uploaded_media", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  dataBase64: text("data_base64").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = typeof candidates.$inferInsert;

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;

export type DbNewsArticle = typeof newsArticles.$inferSelect;
export type NewDbNewsArticle = typeof newsArticles.$inferInsert;

export type UploadedMedia = typeof uploadedMedia.$inferSelect;
export type NewUploadedMedia = typeof uploadedMedia.$inferInsert;
