import { NextResponse } from "next/server";

// BFF logout — deletes the admin_token cookie from the Next.js app domain.
export async function POST() {
  const response = NextResponse.json({ message: "Logged out" });
  response.cookies.delete("admin_token");
  return response;
}
