import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = String(session.user.companyId);

    const users = await prisma.users.findMany({
      where: { companyId },
      include: {
        work_shifts: {
          include: { 
            segments: { 
              include: { 
                entities: true 
              } 
            } 
          },
          orderBy: { shiftDate: "desc" },
        }
      },
    });

    const employees = users.map(user => ({
      id: user.id, 
      name: user.name,
      department: user.department, 
      location: user.location,     
      role: user.role,             
      shifts: user.work_shifts.map(shift => ({
        id: shift.id,
        isRecurring: shift.isRecurring,
        recurrenceRule: shift.recurrenceRule,
        overridesShiftId: shift.overridesShiftId,
        shiftDate: shift.shiftDate ? shift.shiftDate.toISOString() : null, 
        startTime: shift.startTime.toISOString(),
        endTime: shift.endTime.toISOString(),
        segments: shift.segments.map(segment => ({
          id: segment.id, 
          startTime: segment.startTime.toISOString(),
          endTime: segment.endTime.toISOString(),
          segmentType: segment.segmentType,
          location: segment.location,
          notes: segment.notes,
          color: segment.color,
          entities: segment.entities

        })),
      })),
    }));

    return NextResponse.json({ employees });
  } catch (error: any) {
    console.error("Error fetching shifts", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = String(session.user.companyId);

    const body = await request.json();
    const {
      userId,       
      shiftDate,    
      startTime,    
      endTime,      
      isRecurring,  
      recurrenceRule,    
      recurrenceEndDate, 
      notes,        
    } = body;

    if (!userId || !shiftDate || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newShift = await prisma.work_shifts.create({
      data: {
        userId,
        companyId,
        shiftDate: new Date(shiftDate),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isRecurring: isRecurring || false,
        recurrenceRule: recurrenceRule || null,
        recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json({ shift: newShift }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating shift", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

