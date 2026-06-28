import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const [user] = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(eq(users.email, email.toLowerCase())).limit(1);

    // Always return success (prevent email enumeration)
    if (!user) return NextResponse.json({ success: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    if (!process.env.RESEND_API_KEY) {
      console.log("[ForgotPassword] No RESEND_API_KEY. Reset URL:", resetUrl);
      return NextResponse.json({ success: true });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? "PeakAudio <noreply@peakaudiodev.loca.lt>",
        to: user.email,
        subject: "Dat lai mat khau - PeakAudio",
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
          <h2 style="color:#1f2937">Dat lai mat khau</h2>
          <p style="color:#6b7280">Xin chao ${user.name ?? user.email},</p>
          <p style="color:#6b7280">Nhan nut ben duoi de dat lai mat khau:</p>
          <a href="${resetUrl}" style="display:inline-block;background:#7c3aed;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Dat lai mat khau</a>
          <p style="color:#9ca3af;font-size:12px">Link co hieu luc 1 gio. Neu ban khong yeu cau, hay bo qua email nay.</p>
        </div>`,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[ForgotPassword] Resend error:", res.status, errBody);
      console.log("[ForgotPassword] Fallback — reset URL:", resetUrl);
    } else {
      const body = await res.json();
      console.log("[ForgotPassword] Resend success:", body);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
