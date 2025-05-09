import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, companyId } = body;

    if (!name || !email || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const inviteToken = randomBytes(20).toString("hex");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.invitation.create({
      data: {
        token: inviteToken,
        companyId: companyId, 
        inviteeEmail: email,  
        expiresAt: expiresAt,
      },
    });

    // in this new workflow we will create a placeholder upon invitation so admin can begin scheduling
    await prisma.users.create({
      data: {
        email,
        name,
        companyId,
      },
    });

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const inviteUrl = `https://schedule-prod.vercel.app/account-management/signup?invite=${inviteToken}`;

    const mailOptions = {
      from: `"When Scheduling" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "You're Invited to Join Our Team!",
      html: `
        <p>Hey ${name},</p>
        <p>You have been invited to join our team. Click the link below to accept the invitation and sign up:</p>
        <p><a href="${inviteUrl}">Join the Team</a></p>
        <p>If you did not expect this invitation, please ignore this email.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error sending invitation email:", error);
    return NextResponse.json(
      { error: "Failed to send invitation email" },
      { status: 500 }
    );
  }
}
