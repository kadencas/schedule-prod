import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  // ────────────────────────── 1.  Parse & validate payload ──────────────────────────
  let payload: any;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("Error parsing payload:", err);
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "No payload provided" }, { status: 400 });
  }

  const {
    shiftId,
    startTime,
    endTime,
    segments = [],
    isRecurring,
    recurrenceRule,
  } = payload as {
    shiftId: string;
    startTime: string;
    endTime: string;
    segments: any[];
    isRecurring: boolean;
    recurrenceRule: string;
  };

  if (!shiftId || !startTime || !endTime || !Array.isArray(segments)) {
    return NextResponse.json(
      { error: "Missing shiftId, startTime, endTime or segments" },
      { status: 400 }
    );
  }

  // ────────────────────────── 2.  Prepare helpers ──────────────────────────
  const segmentIds = segments.map((s) => s.id); // [] when all segments removed

  // ────────────────────────── 3.  Atomic DB write ──────────────────────────
  try {
    const [updatedShift] = await prisma.$transaction([
      // 3‑a) update the parent shift
      prisma.work_shifts.update({
        where: { id: shiftId },
        data: {
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          isRecurring,
          recurrenceRule,
        },
      }),

      // 3‑b) delete any segment rows that vanished from the payload
      prisma.segments.deleteMany({
        where: {
          shiftId,
          ...(segmentIds.length ? { id: { notIn: segmentIds } } : {}), // if [] ⇒ delete all
        },
      }),

      // 3‑c) upsert each segment that *is* in the payload
      ...segments.map((seg) =>
        prisma.segments.upsert({
          where: { id: seg.id },
          update: {
            startTime: new Date(seg.startTime),
            endTime: new Date(seg.endTime),
            segmentType: seg.segmentType,
            location: seg.location ?? "",
            notes: seg.notes ?? "",
            color: seg.color,
            entityId: seg.entityId ?? null,
          },
          create: {
            id: seg.id,
            shiftId,
            startTime: new Date(seg.startTime),
            endTime: new Date(seg.endTime),
            segmentType: seg.segmentType,
            location: seg.location ?? "",
            notes: seg.notes ?? "",
            color: seg.color,
            entityId: seg.entityId ?? null,
          },
        })
      ),
    ]);

    return NextResponse.json({ success: true, shift: updatedShift });
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json({ error: "Error updating shift" }, { status: 500 });
  }
}
