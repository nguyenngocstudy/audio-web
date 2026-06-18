import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import ThemeSettingsClient from "./ThemeSettingsClient";

export const metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const session = await auth();
  const user = session?.user?.id
    ? (await db.select({ name: users.name, email: users.email })
        .from(users).where(eq(users.id, session.user.id)).limit(1))[0]
    : null;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Cài đặt</h1>
      <ThemeSettingsClient user={user} />
    </div>
  );
}