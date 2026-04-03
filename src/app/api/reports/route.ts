import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const totalCustomers = await prisma.customer.count();
    
    // Calls where user marked "done"
    const completedCalls = await prisma.callLog.count({
      where: { outcome: "done" }
    });

    const orders = await (prisma.order as any).findMany({
      select: {
        id: true,
        ordered_at: true,
        total_price: true,
        delivery_status: true,
        metadata: true,
      }
    });

    const totalOrders = orders.length;
    let rtoOrders = 0;
    
    // Aggregators
    const revenueByDate: Record<string, number> = {};
    const courierCounts: Record<string, number> = {};
    const rtoRiskCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};

    for (const o of orders) {
      if (o.delivery_status === "rto") rtoOrders++;

      // Status
      statusCounts[o.delivery_status] = (statusCounts[o.delivery_status] || 0) + 1;

      // Revenue Date
      if (o.ordered_at) {
        const dateStr = o.ordered_at.toISOString().split("T")[0];
        revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (o.total_price || 0);
      }

      // Metadata extraction
      if ((o as any).metadata && typeof (o as any).metadata === "object") {
        const meta = (o as any).metadata as Record<string, any>;
        
        // Courier
        if (meta.courier_company) {
          const courier = String(meta.courier_company).trim();
          courierCounts[courier] = (courierCounts[courier] || 0) + 1;
        } else {
          courierCounts["Unknown"] = (courierCounts["Unknown"] || 0) + 1;
        }

        // RTO Risk
        if (meta.rto_risk) {
          const riskStr = String(meta.rto_risk).trim();
          rtoRiskCounts[riskStr] = (rtoRiskCounts[riskStr] || 0) + 1;
        } else {
          rtoRiskCounts["Unscored"] = (rtoRiskCounts["Unscored"] || 0) + 1;
        }
      } else {
        courierCounts["Unknown"] = (courierCounts["Unknown"] || 0) + 1;
        rtoRiskCounts["Unscored"] = (rtoRiskCounts["Unscored"] || 0) + 1;
      }
    }

    // Format for Recharts
    const revenueChart = Object.entries(revenueByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    const courierChart = Object.entries(courierCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const rtoRiskChart = Object.entries(rtoRiskCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const statusChart = Object.entries(statusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Fetch all logs and join with customer/task info for the export
    const logs = await prisma.callLog.findMany({
      include: {
        customer: true,
        task: {
          include: { order: true }
        }
      },
      orderBy: {
        called_at: "desc"
      }
    });

    const agentPerformance: Record<string, { name: string, done: number, skipped: number, rescheduled: number, total: number }> = {};
    for (const log of logs) {
      const agent = log.agent_name || "System";
      if (!agentPerformance[agent]) {
        agentPerformance[agent] = { name: agent, done: 0, skipped: 0, rescheduled: 0, total: 0 };
      }
      agentPerformance[agent].total++;
      if (log.outcome === "done") agentPerformance[agent].done++;
      else if (log.outcome === "skipped") agentPerformance[agent].skipped++;
      else if (log.outcome === "rescheduled") agentPerformance[agent].rescheduled++;
    }

    const agentChart = Object.values(agentPerformance)
      .sort((a, b) => b.done - a.done);

    return NextResponse.json({
      totalCustomers,
      completedCalls,
      totalOrders,
      rtoOrders,
      charts: {
        revenueChart,
        courierChart,
        rtoRiskChart,
        statusChart,
        agentChart
      },
      logs
    });
  } catch (error) {
    console.error("GET Reports Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
