import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Double check admin role
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser && dbUser.role !== 'admin') {
      return NextResponse.json({ error: "Only admins can perform bulk deletions" }, { status: 403 });
    }

    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
    }

    if (ids.includes("ALL")) {
      // MASS NUKE
      await prisma.$transaction([
        prisma.callLog.deleteMany({}),
        prisma.task.deleteMany({}),
        prisma.order.deleteMany({}),
        prisma.customer.deleteMany({}),
      ]);
      return NextResponse.json({ success: true, message: "All CRM data cleared (Test records purged)" });
    } else {
      // Selected Delete
      await prisma.$transaction([
        prisma.callLog.deleteMany({ where: { customer_id: { in: ids } } }),
        prisma.task.deleteMany({ where: { customer_id: { in: ids } } }),
        prisma.order.deleteMany({ where: { customer_id: { in: ids } } }),
        prisma.customer.deleteMany({ where: { id: { in: ids } } }),
      ]);
      return NextResponse.json({ success: true, message: `Successfully deleted ${ids.length} customers` });
    }
  } catch (error: any) {
    console.error("Bulk Delete Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete data" }, { status: 500 });
  }
}
