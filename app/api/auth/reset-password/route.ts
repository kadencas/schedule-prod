import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    const tokenRecord = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
      return NextResponse.json({ message: "Invalid or expired token." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { id: tokenRecord.userId },
      data: { passwordHash: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ message: "Password successfully reset." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }
}
