import { NextRequest, NextResponse } from "next/server";

// BFF login — forwards credentials to the backend, then sets admin_token as an
// httpOnly cookie on the Next.js app domain so proxy.ts can read it.
export async function POST(req: NextRequest) {
  const body = await req.json();

  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.NEXT_PUBLIC_X_API_KEY ?? "",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json(data);

  // Set on the Next.js app domain — proxy.ts can now read this cookie.
  response.cookies.set("admin_token", data.data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60, // 8 h — matches JWT expiry
    path: "/",
  });

  return response;
}
