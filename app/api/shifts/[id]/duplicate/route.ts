// /app/api/shifts/[id]/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { RRule } from "rrule";

const prisma = new PrismaClient();

const RRuleWeekdays: { [key: string]: any } = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const sourceShiftId = params.id;
  const body = await request.json();
  const { startDate, endDate, pattern, conflictPolicy } = body;

  // --- 1. Fetch the Source Shift as a template ---
  const sourceShift = await prisma.work_shifts.findUnique({
    where: { id: sourceShiftId },
    include: { segments: true },
  });

  if (!sourceShift) {
    return NextResponse.json({ message: "Source shift not found" }, { status: 404 });
  }

  // --- 2. Generate target dates ---
  const rule = new RRule({
    freq: pattern.type === "daily" ? RRule.DAILY : RRule.WEEKLY,
    dtstart: new Date(`${startDate}T00:00:00Z`),
    until: new Date(`${endDate}T23:59:59Z`),
    byweekday:
      pattern.type === "weekly" && pattern.days
        ? pattern.days.map((day: string) => RRuleWeekdays[day])
        : undefined,
  });
  let targetDates = rule.all();

  // --- 3. Handle Conflicts (using the `shiftDate` field) ---
  const shiftsToDelete: string[] = [];
  if (targetDates.length > 0) {
    // UPDATED: Query using `shiftDate` for conflict checking
    const existingShifts = await prisma.work_shifts.findMany({
      where: {
        userId: sourceShift.userId,
        shiftDate: { in: targetDates },
      },
      select: { id: true, shiftDate: true },
    });

    const existingShiftDates = new Set(
      existingShifts.map((s) => s.shiftDate.toISOString().split("T")[0])
    );

    if (conflictPolicy === "overwrite") {
      shiftsToDelete.push(...existingShifts.map(s => s.id));
    } else { // 'skip' policy
      targetDates = targetDates.filter(
        (date) => !existingShiftDates.has(date.toISOString().split("T")[0])
      );
    }
  }

  if (targetDates.length === 0) {
    return NextResponse.json({
        message: "No new shifts to create after applying conflict policy.",
        createdCount: 0,
      }, { status: 200 });
  }

  // --- 4. Prepare new shift and segment data for creation ---
  // UPDATED: Calculate duration from separate startTime and endTime fields
  const shiftDuration = sourceShift.endTime.getTime() - sourceShift.startTime.getTime();
  
  const newShiftsData = targetDates.map((date) => {
    // Helper function to combine a new date with an original time
    const combineDateAndTime = (newDate: Date, originalTime: Date): Date => {
      const combined = new Date(newDate);
      combined.setUTCHours(
        originalTime.getUTCHours(),
        originalTime.getUTCMinutes(),
        originalTime.getUTCSeconds(),
        originalTime.getUTCMilliseconds()
      );
      return combined;
    };
    
    // UPDATED: Construct new shift object based on your schema
    const newShiftStartTime = combineDateAndTime(date, sourceShift.startTime);
    const newShiftEndTime = combineDateAndTime(date, sourceShift.endTime);

    const newSegmentsData = sourceShift.segments.map(segment => {
      const newSegmentStartTime = combineDateAndTime(date, segment.startTime);
      const newSegmentEndTime = combineDateAndTime(date, segment.endTime);
      return {
        // Copy relevant segment data
        segmentType: segment.segmentType,
        location: segment.location,
        notes: segment.notes,
        color: segment.color,
        entityId: segment.entityId,
        // Set new times
        startTime: newSegmentStartTime,
        endTime: newSegmentEndTime,
      };
    });

    return {
      userId: sourceShift.userId,
      companyId: sourceShift.companyId,
      notes: sourceShift.notes,
      shiftDate: date, // The new date for the shift
      startTime: newShiftStartTime,
      endTime: newShiftEndTime,
      isRecurring: false, // Duplicated shifts are not recurring
      segments: newSegmentsData,
    };
  });

  // --- 5. Execute DB operations in a transaction ---
  try {
    const operations = [];

    if (shiftsToDelete.length > 0) {
      operations.push(prisma.work_shifts.deleteMany({ where: { id: { in: shiftsToDelete } } }));
    }

    for (const shift of newShiftsData) {
      const { segments, ...shiftData } = shift;
      operations.push(
        prisma.work_shifts.create({
          data: {
            ...shiftData,
            segments: { createMany: { data: segments } },
          },
        })
      );
    }
    
    await prisma.$transaction(operations);

    return NextResponse.json({
        message: "Shifts duplicated successfully!",
        createdCount: newShiftsData.length,
      }, { status: 201 });
  } catch (error) {
    console.error("Failed to duplicate shifts:", error);
    return NextResponse.json({ message: "An error occurred during duplication." }, { status: 500 });
  }
}