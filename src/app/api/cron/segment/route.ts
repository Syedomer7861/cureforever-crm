import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: true,
      },
    });

    const settings = await prisma.setting.findFirst() || { inactive_threshold_days: 45 };
    const inactiveThreshold = settings.inactive_threshold_days;

    const today = new Date();
    let updatedCount = 0;

    for (const c of customers) {
      let segment = "one_time";
      let latestOrderDate: Date | null = null;
      let rtoCount = 0;

      for (const o of c.orders) {
        if (o.delivery_status === "rto") rtoCount++;
        if (!latestOrderDate || o.ordered_at > latestOrderDate) {
          latestOrderDate = o.ordered_at;
        }
      }

      const totalValidOrders = c.orders.length - rtoCount;

      if (totalValidOrders >= 2) {
        segment = "repeat";
      }

      if (latestOrderDate) {
        const diffTime = Math.abs(today.getTime() - latestOrderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > inactiveThreshold) {
          segment = "inactive";
        }
      }

      if (c.segment !== segment || c.total_orders !== c.orders.length || c.rto_count !== rtoCount || c.rto_flag !== (rtoCount > 0)) {
        await prisma.customer.update({
          where: { id: c.id },
          data: {
            segment,
            total_orders: c.orders.length,
            rto_count: rtoCount,
            rto_flag: rtoCount > 0,
            last_order_date: latestOrderDate,
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error) {
    console.error("Segmentation Cron error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
