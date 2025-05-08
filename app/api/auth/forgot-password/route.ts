import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ message: "If that email exists, a reset link has been sent." }, { status: 200 });
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: expires,
    },
  });

  await sendResetEmail(email, token);

  return NextResponse.json({ message: "Reset link sent to your email." }, { status: 200 });
}
