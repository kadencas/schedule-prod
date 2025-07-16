import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
    return NextResponse.json({ message: 'startDate and endDate query parameters are required' }, { status: 400 });
  }

  try {
    const segments = await prisma.segments.findMany({
      where: {
        startTime: {
          gte: new Date(startDate),
        },
        endTime: {
          lt: new Date(endDate),
        },
      },
    });
    console.log(segments)
    return NextResponse.json(segments);
  } catch (error) {
    console.error("Failed to fetch segments:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}