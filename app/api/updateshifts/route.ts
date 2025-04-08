import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  let payload;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("Error parsing payload:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "No payload provided" }, { status: 400 });
  }

  const { companyId, schedule } = payload;
  if (!companyId || !schedule) {
    return NextResponse.json({ error: "Missing companyId or schedule data" }, { status: 400 });
  }

  try {
    for (const employee of schedule) {
      for (const shift of employee.shifts) {
        const shiftStart = new Date(shift.startTime);
        const shiftEnd = new Date(shift.endTime);
        const shiftDate = new Date(shiftStart);
        shiftDate.setHours(0, 0, 0, 0);

        let shiftRecord;
        if (shift.id) {
          shiftRecord = await prisma.work_shifts.update({
            where: { id: shift.id },
            data: {
              startTime: shiftStart,
              endTime: shiftEnd,
              shiftDate,
            },
          });
        } else {
          shiftRecord = await prisma.work_shifts.create({
            data: {
              userId: employee.id, 
              companyId,
              shiftDate,
              startTime: shiftStart,
              endTime: shiftEnd,
              isRecurring: false,
            },
          });
        }

        for (const segment of shift.segments) {
          const segStart = new Date(segment.startTime);
          const segEnd = new Date(segment.endTime);

          if (segment.id) {
            await prisma.segments.update({
              where: { id: segment.id },
              data: {
                startTime: segStart,
                endTime: segEnd,
                segmentType: segment.segmentType,
                location: segment.location || '',
                notes: segment.notes || '',
              },
            });
          } else {
            await prisma.segments.create({
              data: {
                shiftId: shiftRecord.id,
                startTime: segStart,
                endTime: segEnd,
                segmentType: segment.segmentType,
                location: segment.location || '',
                notes: segment.notes || '',
              },
            });
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating shifts:", error);
    return NextResponse.json({ error: "Error updating shifts" }, { status: 500 });
  }
}

