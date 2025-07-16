import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const entities = await prisma.entities.findMany();
    return NextResponse.json(entities);
  } catch (error) {
    console.error("Failed to fetch entities:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}