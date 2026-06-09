import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/src/lib/jwt";
import { hasPermission, PAGE_PERMISSION_MAP } from "@/src/lib/permissions";

// Routes that don't require a session.
// Both page auth paths AND the BFF API routes that don't require a session.
const PUBLIC_PATHS = [
  "/login",
  "/accept-invite",
  "/api/admin/auth/login",
  "/api/admin/auth/logout",
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Client API calls: axios adds Authorization: Bearer <token>.
  // Page navigations: browser sends httpOnly admin_token cookie.
  const auth = req.headers.get("authorization");
  const cookieToken = req.cookies.get("admin_token")?.value;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : cookieToken;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(token);
  } catch {
    // Expired or tampered — clear cookie and send to login.
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("admin_token");
    return res;
  }

  // Permission gate — real admin, wrong page → dashboard, not login.
  const match = Object.entries(PAGE_PERMISSION_MAP).find(([path]) =>
    pathname.startsWith(path),
  );
  if (match) {
    const [, required] = match;
    if (
      !hasPermission(
        payload.permissions,
        payload.isSuper,
        required.module,
        required.action,
      )
    ) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Runs on every route except Next.js internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|svg/).*)"],
};
