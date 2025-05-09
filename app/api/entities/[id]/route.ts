import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = String(session.user.companyId);
  const entityId = params.id;

  try {
    const body = await request.json();

    const {
      name,
      type,
      icon,
      color,
      requiresCoverage,
      minCoverage,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "Missing required fields: name or type" },
        { status: 400 }
      );
    }

    // First check if the entity exists and belongs to the company
    const existingEntity = await prisma.entities.findFirst({
      where: {
        id: entityId,
        companyId,
      },
    });

    if (!existingEntity) {
      return NextResponse.json(
        { error: "Entity not found or unauthorized" },
        { status: 404 }
      );
    }

    // Update the entity
    const updatedEntity = await prisma.entities.update({
      where: {
        id: entityId,
      },
      data: {
        name,
        type,
        icon,
        color,
        requiresCoverage: requiresCoverage ?? false,
        minCoverage: minCoverage ?? null,
      },
    });

    return NextResponse.json(updatedEntity);
  } catch (error) {
    console.error("Error updating entity:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 