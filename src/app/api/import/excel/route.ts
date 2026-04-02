import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { rows } = await req.json();
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid rows data" }, { status: 400 });
    }

    // Default settings for tasks
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }

    let successCount = 0;

    for (const row of rows) {
      const name = row["Customer Name"] || row["Name"];
      const phone = row["Phone Number"] || row["Phone"];
      const orderNumber = row["Order ID"] || row["Order"];
      const productName = row["Product Name"] || row["Product"];
      const deliveryDateStr = row["Delivery Date"] || row["Delivered At"];

      if (!phone || !name || !orderNumber) continue;

      // Ensure strings
      const phoneStr = String(phone).trim();
      const orderStr = String(orderNumber).trim();

      // Upsert Customer
      const customer = await prisma.customer.upsert({
        where: { phone: phoneStr },
        update: { name },
        create: { name, phone: phoneStr },
      });

      // Insert Order
      const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr) : null;
      let deliveryStatus = deliveryDate ? "delivered" : "pending";

      // SQLite handles relations easily using upsert if unique
      // Wait, order_number is not strictly unique inside shopify, but for import we can assume uniqueness or just create unconditionally?
      // Since it's an import, let's try to upsert based on order_number + customer_id if possible, 
      // but Prisma doesn't have a unique constraint on order_number. We will just create it.

      // Better: find first to avoid duplicates
      let order = await prisma.order.findFirst({
        where: { 
          customer_id: customer.id,
          order_number: orderStr 
        }
      });

      if (!order) {
        order = await prisma.order.create({
          data: {
            customer_id: customer.id,
            order_number: orderStr,
            line_items: JSON.stringify([{ name: productName || "Imported Product", qty: 1 }]),
            delivery_status: deliveryStatus,
            ordered_at: new Date(),
            delivered_at: deliveryDate,
            source: "excel"
          }
        });
      }

      // Generate Tasks if delivered and recent enough
      if (deliveryStatus === "delivered" && deliveryDate) {
        const reviewDate = new Date(deliveryDate);
        reviewDate.setDate(reviewDate.getDate() + settings.review_offset_days);

        const reorderDate = new Date(deliveryDate);
        reorderDate.setDate(reorderDate.getDate() + settings.reorder_offset_days);

        // check duplicates
        const existingTasks = await prisma.task.findMany({ where: { order_id: order.id }});
        const types = existingTasks.map((t) => t.task_type);

        if (!types.includes("review")) {
          await prisma.task.create({
            data: {
              order_id: order.id,
              customer_id: customer.id,
              task_type: "review",
              due_date: reviewDate,
            },
          });
        }

        if (!types.includes("reorder")) {
          await prisma.task.create({
            data: {
              order_id: order.id,
              customer_id: customer.id,
              task_type: "reorder",
              due_date: reorderDate,
            },
          });
        }
      }

      successCount++;
    }

    return NextResponse.json({ success: true, count: successCount });
  } catch (err) {
    console.error("Excel import error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
