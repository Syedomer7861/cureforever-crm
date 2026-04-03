import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("GET Settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    
    // Strip non-updatable fields
    const { id, created_at, updated_at, ...updateData } = body;
    
    let settings = await prisma.setting.findFirst();

    if (!settings) {
      settings = await prisma.setting.create({ data: updateData });
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: updateData,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("PATCH Settings error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
