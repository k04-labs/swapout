import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSuperAdminToken, setSuperAdminCookie } from "@/lib/super-admin-auth";

export const runtime = "nodejs";

type LoginBody = {
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginBody | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json(
      { message: "Username and password are required." },
      { status: 400 },
    );
  }

  const admin = await prisma.superAdmin.findUnique({
    where: { username: body.username },
  });

  if (!admin) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const isValid = await bcrypt.compare(body.password, admin.passwordHash);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid credentials." }, { status: 401 });
  }

  const token = await createSuperAdminToken(admin.id);
  const response = NextResponse.json({ success: true }, { status: 200 });
  setSuperAdminCookie(response, token);
  return response;
}
