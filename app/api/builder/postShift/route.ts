import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, companyId, shiftDate, startTime, endTime } = body;

    const newShift = await prisma.work_shifts.create({
      data: {
        userId,
        companyId,
        shiftDate: new Date(shiftDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return NextResponse.json({ success: true, data: newShift });
  } catch (error: any) {
    console.error("Error creating shift:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
