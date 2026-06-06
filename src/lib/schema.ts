import {
  pgTable, uuid, varchar, text, boolean,
  integer, timestamp, pgEnum,
} from "drizzle-orm/pg-core";

export const genreEnum = pgEnum("genre", [
  "tinh_cam","ngon_tinh","co_dai","huyen_huyen","tram_cam","hanh_dong",
]);
export const txTypeEnum = pgEnum("tx_type", [
  "subscription","coin_topup","chapter_unlock",
]);
export const txStatusEnum = pgEnum("tx_status", [
  "pending","paid","failed","cancelled",
]);

export const users = pgTable("users", {
  id:           uuid("id").defaultRandom().primaryKey(),
  email:        varchar("email",{length:255}).notNull().unique(),
  name:         varchar("name",{length:255}),
  avatarUrl:    text("avatar_url"),
  passwordHash: text("password_hash"),
  coinBalance:  integer("coin_balance").notNull().default(0),
  vipUntil:     timestamp("vip_until"),
  isAdmin:      boolean("is_admin").notNull().default(false),
  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
});

export const stories = pgTable("stories", {
  id:            uuid("id").defaultRandom().primaryKey(),
  title:         varchar("title",{length:500}).notNull(),
  author:        varchar("author",{length:255}),
  narrator:      varchar("narrator",{length:255}),
  description:   text("description"),
  coverUrl:      text("cover_url"),
  genre:         genreEnum("genre").notNull(),
  isPublished:   boolean("is_published").notNull().default(false),
  totalChapters: integer("total_chapters").notNull().default(0),
  viewCount:     integer("view_count").notNull().default(0),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
  updatedAt:     timestamp("updated_at").notNull().defaultNow(),
});

export const chapters = pgTable("chapters", {
  id:            uuid("id").defaultRandom().primaryKey(),
  storyId:       uuid("story_id").notNull().references(()=>stories.id,{onDelete:"cascade"}),
  title:         varchar("title",{length:500}).notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  audioUrl:      text("audio_url"),
  durationSec:   integer("duration_sec"),
  isFree:        boolean("is_free").notNull().default(false),
  coinCost:      integer("coin_cost").notNull().default(0),
  isPublished:   boolean("is_published").notNull().default(false),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

export const listenProgress = pgTable("listen_progress", {
  id:          uuid("id").defaultRandom().primaryKey(),
  userId:      uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  chapterId:   uuid("chapter_id").notNull().references(()=>chapters.id,{onDelete:"cascade"}),
  positionSec: integer("position_sec").notNull().default(0),
  completedAt: timestamp("completed_at"),
  updatedAt:   timestamp("updated_at").notNull().defaultNow(),
});

export const chapterUnlocks = pgTable("chapter_unlocks", {
  id:         uuid("id").defaultRandom().primaryKey(),
  userId:     uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  chapterId:  uuid("chapter_id").notNull().references(()=>chapters.id,{onDelete:"cascade"}),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id:             uuid("id").defaultRandom().primaryKey(),
  userId:         uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  payosOrderCode: varchar("payos_order_code",{length:50}).unique(),
  type:           txTypeEnum("type").notNull(),
  status:         txStatusEnum("status").notNull().default("pending"),
  amountVnd:      integer("amount_vnd").notNull(),
  coinAmount:     integer("coin_amount"),
  metadata:       text("metadata"),
  paidAt:         timestamp("paid_at"),
  createdAt:      timestamp("created_at").notNull().defaultNow(),
});

export type User        = typeof users.$inferSelect;
export type Story       = typeof stories.$inferSelect;
export type Chapter     = typeof chapters.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
