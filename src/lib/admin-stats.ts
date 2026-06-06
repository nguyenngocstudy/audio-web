import { db } from "./db";
import { users, stories, chapters, transactions, listenProgress } from "./schema";
import { sql, count, sum, gte, and, eq } from "drizzle-orm";

export async function getOverviewStats() {
  const now  = new Date();
  const som  = new Date(now.getFullYear(), now.getMonth(), 1);
  const solm = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [tu, ntm, nltm, ts, tc, vu, rtm, rltm, tr] = await Promise.all([
    db.select({ c: count() }).from(users),
    db.select({ c: count() }).from(users).where(gte(users.createdAt, som)),
    db.select({ c: count() }).from(users).where(and(gte(users.createdAt, solm), sql`${users.createdAt} < ${som}`)),
    db.select({ c: count() }).from(stories).where(eq(stories.isPublished, true)),
    db.select({ c: count() }).from(chapters).where(eq(chapters.isPublished, true)),
    db.select({ c: count() }).from(users).where(gte(users.vipUntil!, now)),
    db.select({ t: sum(transactions.amountVnd) }).from(transactions).where(and(eq(transactions.status, "paid"), gte(transactions.paidAt!, som))),
    db.select({ t: sum(transactions.amountVnd) }).from(transactions).where(and(eq(transactions.status, "paid"), gte(transactions.paidAt!, solm), sql`${transactions.paidAt} < ${som}`)),
    db.select({ t: sum(transactions.amountVnd) }).from(transactions).where(eq(transactions.status, "paid")),
  ]);

  const thisRev = Number(rtm[0].t ?? 0);
  const lastRev = Number(rltm[0].t ?? 0);
  const thisU   = ntm[0].c;
  const lastU   = nltm[0].c;

  return {
    totalUsers:        tu[0].c,
    newUsersThisMonth: thisU,
    userGrowth:        lastU > 0 ? Math.round(((thisU - lastU) / lastU) * 100) : 100,
    totalStories:      ts[0].c,
    totalChapters:     tc[0].c,
    vipUsers:          vu[0].c,
    vipRate:           tu[0].c > 0 ? Math.round((vu[0].c / tu[0].c) * 100) : 0,
    revenueThisMonth:  thisRev,
    revenueLastMonth:  lastRev,
    revenueGrowth:     lastRev > 0 ? Math.round(((thisRev - lastRev) / lastRev) * 100) : 100,
    totalRevenue:      Number(tr[0].t ?? 0),
  };
}

export async function getMonthlyRevenue() {
  const rows = await db.execute(sql`
    SELECT TO_CHAR(DATE_TRUNC('month', paid_at), 'MM/YYYY') AS month,
           COALESCE(SUM(amount_vnd), 0)::int AS revenue,
           COUNT(*)::int AS orders
    FROM transactions WHERE status = 'paid' AND paid_at >= NOW() - INTERVAL '7 months'
    GROUP BY DATE_TRUNC('month', paid_at) ORDER BY 1 ASC`);
  return rows.rows as { month: string; revenue: number; orders: number }[];
}

export async function getDailyNewUsers() {
  const rows = await db.execute(sql`
    SELECT TO_CHAR(DATE_TRUNC('day', created_at), 'DD/MM') AS day,
           COUNT(*)::int AS new_users
    FROM users WHERE created_at >= NOW() - INTERVAL '14 days'
    GROUP BY DATE_TRUNC('day', created_at) ORDER BY 1 ASC`);
  return rows.rows as { day: string; new_users: number }[];
}

export async function getTopStories(limit = 10) {
  const rows = await db.execute(sql`
    SELECT s.id, s.title, s.genre, s.view_count,
           COUNT(DISTINCT lp.user_id)::int AS unique_listeners,
           COUNT(lp.id)::int AS total_plays
    FROM stories s
    LEFT JOIN chapters c ON c.story_id = s.id
    LEFT JOIN listen_progress lp ON lp.chapter_id = c.id
    WHERE s.is_published = true
    GROUP BY s.id ORDER BY total_plays DESC LIMIT ${limit}`);
  return rows.rows as { id: string; title: string; genre: string; view_count: number; unique_listeners: number; total_plays: number }[];
}

export async function getRecentTransactions(limit = 20) {
  const rows = await db.execute(sql`
    SELECT t.id, t.payos_order_code, t.type, t.status, t.amount_vnd,
           t.created_at, t.paid_at, u.email, u.name
    FROM transactions t JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC LIMIT ${limit}`);
  return rows.rows as any[];
}

export async function getRevenueByType() {
  const rows = await db.execute(sql`
    SELECT type, COUNT(*)::int AS count, COALESCE(SUM(amount_vnd), 0)::int AS total
    FROM transactions WHERE status = 'paid' GROUP BY type`);
  return rows.rows as { type: string; count: number; total: number }[];
}
