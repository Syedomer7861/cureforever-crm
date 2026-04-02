import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    // Verification would go here in production analyzing X-Api-Key or similar headers
    const payload = JSON.parse(bodyText);

    // Shiprocket payload format varies, but usually:
    // { "awb": "...", "current_status": "DELIVERED", "scans": [...] }
    const awb = payload?.awb;
    const status = payload?.current_status;

    if (!awb || !status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Find the order with this tracking number
    const order = await prisma.order.findFirst({
      where: { tracking_number: awb },
      include: { customer: true },
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Determine target delivery status
    let newDeliveryStatus = "pending";
    if (status.toUpperCase() === "DELIVERED") {
      newDeliveryStatus = "delivered";
    } else if (status.toUpperCase().includes("RTO")) {
      newDeliveryStatus = "rto";
    } else if (status.toUpperCase().includes("TRANSIT") || status.toUpperCase().includes("DISPATCH")) {
      newDeliveryStatus = "in_transit";
    }

    // Update the order status
    await prisma.order.update({
      where: { id: order.id },
      data: {
        delivery_status: newDeliveryStatus,
        delivered_at: newDeliveryStatus === "delivered" ? new Date() : order.delivered_at,
      },
    });

    // Workflow Actions
    if (newDeliveryStatus === "rto") {
      // Set RTO flag on customer
      await prisma.customer.update({
        where: { id: order.customer.id },
        data: {
          rto_flag: true,
          rto_count: { increment: 1 },
        },
      });

      // Cancel pending tasks for this order
      await prisma.task.updateMany({
        where: { order_id: order.id, status: "pending" },
        data: { status: "cancelled" },
      });
    } else if (newDeliveryStatus === "delivered") {
      // Create Review and Reorder Tasks
      // First get Settings (create default if none)
      let settings = await prisma.setting.findFirst();
      if (!settings) {
        settings = await prisma.setting.create({ data: {} });
      }

      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + settings.review_offset_days);

      const reorderDate = new Date();
      reorderDate.setDate(reorderDate.getDate() + settings.reorder_offset_days);

      // We should check if tasks already exist to be idempotent
      const existingTasks = await prisma.task.findMany({
        where: { order_id: order.id },
      });

      const types = existingTasks.map((t) => t.task_type);

      if (!types.includes("review")) {
        await prisma.task.create({
          data: {
            order_id: order.id,
            customer_id: order.customer.id,
            task_type: "review",
            due_date: reviewDate,
          },
        });
      }

      if (!types.includes("reorder")) {
        await prisma.task.create({
          data: {
            order_id: order.id,
            customer_id: order.customer.id,
            task_type: "reorder",
            due_date: reorderDate,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: `Processed AWB ${awb} as ${newDeliveryStatus}` });
  } catch (error) {
    console.error("Shiprocket webhook error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
