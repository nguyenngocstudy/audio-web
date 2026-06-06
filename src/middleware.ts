import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED = ["/profile", "/vip", "/history"];
const AUTH_ONLY = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const loggedIn = !!req.auth;

  if (AUTH_ONLY.some(r => pathname.startsWith(r)) && loggedIn)
    return NextResponse.redirect(new URL("/", req.url));

  if (PROTECTED.some(r => pathname.startsWith(r)) && !loggedIn)
    return NextResponse.redirect(new URL(`/login?next=${pathname}`, req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon|icons|manifest).*)"],
};
