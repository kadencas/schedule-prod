// app/api/sendListShifts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // Parse and validate payload
        const payload = await request.json();
        if (!Array.isArray(payload)) {
            return NextResponse.json(
                { error: 'Invalid payload: expected an array of shifts' },
                { status: 400 }
            );
        }

        let savedCount = 0;

        for (const shift of payload) {
            // Basic validation
            if (!shift.id || !shift.userId) continue;

            // Fetch user's companyId to ensure valid FK
            const userRecord = await prisma.users.findUnique({
                where: { id: shift.userId },
                select: { companyId: true }
            });
            if (!userRecord || !userRecord.companyId) {
                console.error(`Skipping shift ${shift.id}: invalid or missing companyId for user ${shift.userId}`);
                continue;
            }
            const companyId = userRecord.companyId;

            // Construct full DateTime strings for Prisma
            const shiftDateStr = shift.shiftDate; // "YYYY-MM-DD"
            const startDateTime = new Date(shift.startTime); // e.g., new Date("2025-07-18T13:00:00.000Z")
            const endDateTime = new Date(shift.endTime);

            // Upsert the shift record using the user's companyId
            await prisma.work_shifts.upsert({
                where: { id: shift.id },
                update: {
                    userId: shift.userId,
                    companyId,
                    shiftDate: new Date(shiftDateStr),
                    startTime: startDateTime,
                    endTime: endDateTime,
                    notes: shift.notes,
                },
                create: {
                    id: shift.id,
                    userId: shift.userId,
                    companyId,
                    shiftDate: new Date(shiftDateStr),
                    startTime: startDateTime,
                    endTime: endDateTime,
                    notes: shift.notes,
                },
            });

            // Upsert each segment, combining with shift date
            const segments = Array.isArray(shift.segments) ? shift.segments : [];
            for (const seg of segments) {
                if (!seg.id) continue;
                const segStart = new Date(seg.startTime);
                const segEnd = new Date(seg.endTime);
                await prisma.segments.upsert({
                    where: { id: seg.id },
                    update: {
                        shiftId: shift.id,
                        entityId: seg.entityId,
                        segmentType: seg.segmentType,
                        location: seg.location,
                        startTime: segStart,
                        endTime: segEnd,
                        notes: seg.notes,
                        color: seg.color,
                    },
                    create: {
                        id: seg.id,
                        shiftId: shift.id,
                        entityId: seg.entityId,
                        segmentType: seg.segmentType,
                        location: seg.location,
                        startTime: segStart,
                        endTime: segEnd,
                        notes: seg.notes,
                        color: seg.color,
                    },
                });
            }

            savedCount++;
        }

        return NextResponse.json({ count: savedCount });
    } catch (error) {
        console.error('Error saving shifts:', error);
        const message = error instanceof Error ? error.message : 'Failed to save shifts';
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}