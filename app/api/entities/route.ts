import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = String(session.user.companyId);

  try {
    const entities = await prisma.entities.findMany({
      where: {
        companyId,
      },
    });

    return NextResponse.json(entities);
  } catch (error) {
    console.error("Error fetching entities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.companyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const companyId = String(session.user.companyId);

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
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth();
const day = now.getDate();

const shiftDate = new Date(year, month, day); 
const startTime = new Date(year, month, day, 9, 0, 0);
const endTime = new Date(year, month, day, 22, 0, 0);

const newEntity = await prisma.entities.create({
  data: {
    name,
    type,
    icon,
    color,
    requiresCoverage: requiresCoverage ?? false,
    minCoverage: minCoverage ?? null,
    companyId,

    entity_shifts: {
      create: {
        companyId,
        shiftDate,
        startTime,
        endTime,
        isRecurring: true,
        recurrenceRule: "FREQ=DAILY;INTERVAL=1",
      },
    },
  },
  include: {
    entity_shifts: true,
  },
});

return NextResponse.json(newEntity, { status: 201 });
} catch (error) {
console.error("Error creating entity with shift:", error);
return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
}