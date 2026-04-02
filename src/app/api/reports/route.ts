import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    
    // Calls where user marked "done"
    const completedCalls = await prisma.callLog.count({
      where: { outcome: "done" }
    });

    const totalOrders = await prisma.order.count();
    const rtoOrders = await prisma.order.count({
      where: { delivery_status: "rto" }
    });

    // Fetch all logs and join with customer/task info for the export
    const logs = await prisma.callLog.findMany({
      include: {
        customer: true,
        task: true
      },
      orderBy: {
        called_at: "desc"
      }
    });

    return NextResponse.json({
      totalCustomers,
      completedCalls,
      totalOrders,
      rtoOrders,
      logs
    });
  } catch (error) {
    console.error("GET Reports Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
