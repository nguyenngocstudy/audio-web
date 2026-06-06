import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function AdminSettingsPage() {
  const session = await auth();
  const [me] = await db.select().from(users).where(eq(users.id, session!.user!.id)).limit(1);

  const ENV_CHECKS = [
    { label: "DATABASE_URL",       ok: !!process.env.DATABASE_URL       },
    { label: "AUTH_SECRET",        ok: !!process.env.AUTH_SECRET        },
    { label: "R2_ACCOUNT_ID",      ok: !!process.env.R2_ACCOUNT_ID      },
    { label: "R2_ACCESS_KEY_ID",   ok: !!process.env.R2_ACCESS_KEY_ID   },
    { label: "R2_SECRET_ACCESS_KEY",ok:!!process.env.R2_SECRET_ACCESS_KEY},
    { label: "R2_BUCKET_NAME",     ok: !!process.env.R2_BUCKET_NAME     },
    { label: "R2_PUBLIC_URL",      ok: !!process.env.R2_PUBLIC_URL      },
    { label: "PAYOS_CLIENT_ID",    ok: !!process.env.PAYOS_CLIENT_ID    },
    { label: "PAYOS_API_KEY",      ok: !!process.env.PAYOS_API_KEY      },
    { label: "PAYOS_CHECKSUM_KEY", ok: !!process.env.PAYOS_CHECKSUM_KEY },
    { label: "NEXT_PUBLIC_APP_URL",ok: !!process.env.NEXT_PUBLIC_APP_URL },
    { label: "GOOGLE_CLIENT_ID",   ok: !!process.env.GOOGLE_CLIENT_ID, optional: true },
  ];

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Cài đặt</h1>
        <p className="text-sm text-gray-400 mt-0.5">Thông tin hệ thống và cấu hình</p>
      </div>

      {/* Admin info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">Tài khoản Admin</p>
        <div className="space-y-2.5 text-sm">
          {[["Email", me.email], ["Tên", me.name ?? "—"], ["ID", me.id]].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-gray-500">{k}</span>
              <span className={`font-mono text-xs ${k === "ID" ? "text-gray-400" : "text-gray-800"}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Env checklist */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">Kiểm tra biến môi trường</p>
        <div className="space-y-2.5">
          {ENV_CHECKS.map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="font-mono text-xs text-gray-600">{item.label}</span>
              <div className="flex items-center gap-1.5">
                {item.optional && !item.ok && <span className="text-xs text-gray-400">tuỳ chọn</span>}
                <span className={`flex items-center gap-1 text-xs font-medium ${item.ok ? "text-teal-600" : item.optional ? "text-gray-400" : "text-rose-500"}`}>
                  <i className={`ti ${item.ok ? "ti-check" : "ti-x"}`} style={{ fontSize: 13 }} />
                  {item.ok ? "OK" : "Thiếu"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PayOS Webhook */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex gap-3">
          <i className="ti ti-info-circle text-amber-600 mt-0.5 flex-shrink-0" style={{ fontSize: 18 }} />
          <div>
            <p className="text-sm font-semibold text-amber-800 mb-1">Cấu hình PayOS Webhook</p>
            <p className="text-xs text-amber-700 mb-2">
              Đăng nhập <strong>my.payos.vn</strong> → Thông tin tích hợp → Webhook URL → điền:
            </p>
            <code className="block bg-amber-100 text-amber-800 text-xs px-3 py-2 rounded-lg break-all">
              {process.env.NEXT_PUBLIC_APP_URL ?? "https://yourdomain.com"}/api/payos/webhook
            </code>
          </div>
        </div>
      </div>

      {/* FFmpeg guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex gap-3">
          <i className="ti ti-terminal text-blue-600 mt-0.5 flex-shrink-0" style={{ fontSize: 18 }} />
          <div>
            <p className="text-sm font-semibold text-blue-800 mb-1">Encode audio sang HLS</p>
            <p className="text-xs text-blue-700 mb-2">
              Chạy lệnh sau trên máy local để convert MP3/WAV → HLS:
            </p>
            <code className="block bg-blue-100 text-blue-800 text-xs px-3 py-2 rounded-lg break-all whitespace-pre-wrap">
              {"ffmpeg -i input.mp3 \\\n  -codec: copy \\\n  -start_number 0 \\\n  -hls_time 10 \\\n  -hls_list_size 0 \\\n  -f hls output/index.m3u8"}
            </code>
            <p className="text-xs text-blue-600 mt-2">Sau đó upload thư mục output/ lên R2 và dán URL index.m3u8 vào chương.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
