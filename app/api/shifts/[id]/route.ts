import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const shiftId = params.id;
    const companyId = String(session.user.companyId);

    // First verify the shift exists and belongs to the company
    const shift = await prisma.work_shifts.findFirst({
      where: {
        id: shiftId,
        companyId,
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found or unauthorized" },
        { status: 404 }
      );
    }

    // Use a transaction to ensure both operations succeed or fail together
    await prisma.$transaction(async (tx) => {
      // First delete all segments associated with the shift
      await tx.segments.deleteMany({
        where: {
          shiftId,
        },
      });

      // Then delete the shift itself
      await tx.work_shifts.delete({
        where: {
          id: shiftId,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 