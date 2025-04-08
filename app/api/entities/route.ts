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
const year = now.getUTCFullYear();
const month = now.getUTCMonth();
const day = now.getUTCDate();

const shiftDate = new Date(Date.UTC(year, month, day)); 
const startTime = new Date(Date.UTC(year, month, day, 13, 0, 0));

// If start time is on the current day, end time should be on the next day
const endTimeDay = day;
const endTimeMonth = month;
const endTimeYear = year;

// Create end time for the next day at 1 AM UTC (9 PM EST)
const endTime = new Date(Date.UTC(endTimeYear, endTimeMonth, endTimeDay, 1, 0, 0));
// Add one day to make it the next day
endTime.setUTCDate(endTime.getUTCDate() + 1);

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