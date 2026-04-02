import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        customer: true,
      },
      orderBy: {
        due_date: "asc"
      }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET Tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
