  import { NextResponse } from "next/server";
  import { getServerSession } from "next-auth";
  import { authOptions } from "@/lib/authOptions";
  import { PrismaClient } from "@prisma/client";

  const prisma = new PrismaClient();

  export async function POST(request: Request) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const companyId = String(session.user.companyId);
      const userId = session.user.id;

      const body = await request.json();
      const { startTime, endTime, segments = [] } = body;

      if (!startTime || !endTime) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }
      
      const newShift = await prisma.work_shifts.create({
        data: {
          userId,
          companyId,
          isRecurring: false,
          recurrenceRule: null,
          shiftDate: new Date(startTime),
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          segments: {
            create: segments.map((s: any) => ({
              startTime: new Date(s.startTime),
              endTime: new Date(s.endTime),
              segmentType: s.segmentType,
              location: s.location,
              notes: s.notes,
              color: s.color,
              ...(s.entityId && { entities: { connect: { id: s.entityId } } }),
            })),
          },
        },
        include: { segments: true },
      });

      return NextResponse.json({ shift: newShift }, { status: 201 });
    } catch (err) {
      console.error("Error creating individual shift:", err);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  }
