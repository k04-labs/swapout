import { NextResponse } from "next/server";
import { clearSuperAdminCookie } from "@/lib/super-admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  clearSuperAdminCookie(response);
  return response;
}
