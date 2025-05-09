import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Invalid Content-Type:', contentType);
      return NextResponse.json(
        { error: "Invalid Content-Type. Must be application/json" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email, name, password, inviteToken } = body;

    if (!email || !name || !password || !inviteToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "User not found. Invite may be missing or corrupted." },
        { status: 400 }
      );
    }

    const invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (now > invitation.expiresAt || invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation token is expired or has already been used." },
        { status: 400 }
      );
    }

    if (invitation.inviteeEmail && invitation.inviteeEmail !== email) {
      return NextResponse.json(
        { error: "Invitation token does not match the provided email." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { email },
      data: {
        name,
        passwordHash,
      },
    });

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "USED" },
    });

    return NextResponse.json(
      { message: "User created successfully", email },
      { status: 200 }
    );
  } catch (error) {
    console.error("Detailed error creating user:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}
