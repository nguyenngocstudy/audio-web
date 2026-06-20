import {
  pgTable, uuid, varchar, text, boolean,
  integer, timestamp, pgEnum,
} from "drizzle-orm/pg-core";

export const genreEnum = pgEnum("genre", [
  "ngon_tinh","tra_xanh","trinh_tham","trong_sinh","co_dai","hoc_duong","hai_huoc","hanh_dong",
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

// ─── Community ────────────────────────────────────────────────────────────────

export const postTypeEnum = pgEnum("post_type", [
  "discussion","suggestion","question","bug_report",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "reply","like","admin_reply","system",
]);

export const communityPosts = pgTable("community_posts", {
  id:         uuid("id").defaultRandom().primaryKey(),
  userId:     uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  type:       postTypeEnum("type").notNull().default("discussion"),
  content:    text("content").notNull(),
  likeCount:  integer("like_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  isPinned:   boolean("is_pinned").notNull().default(false),
  isHidden:   boolean("is_hidden").notNull().default(false),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
});

export const communityComments = pgTable("community_comments", {
  id:        uuid("id").defaultRandom().primaryKey(),
  postId:    uuid("post_id").notNull().references(()=>communityPosts.id,{onDelete:"cascade"}),
  userId:    uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  parentId:  uuid("parent_id"), // null = top-level, uuid = reply to comment
  content:   text("content").notNull(),
  isHidden:  boolean("is_hidden").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const communityLikes = pgTable("community_likes", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  postId:    uuid("post_id").notNull().references(()=>communityPosts.id,{onDelete:"cascade"}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id:        uuid("id").defaultRandom().primaryKey(),
  userId:    uuid("user_id").notNull().references(()=>users.id,{onDelete:"cascade"}),
  type:      notificationTypeEnum("type").notNull().default("system"),
  title:     varchar("title",{length:255}).notNull(),
  body:      text("body"),
  link:      text("link"),
  isRead:    boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CommunityPost    = typeof communityPosts.$inferSelect;
export type CommunityComment = typeof communityComments.$inferSelect;
export type Notification     = typeof notifications.$inferSelect;
