import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Shopify Admin API Sync
 * Fetches recent orders from Shopify and upserts them into the CRM database.
 */
export async function POST() {
  try {
    const settings = await prisma.setting.findFirst();
    if (!settings?.shopify_store_domain || !settings?.shopify_api_key) {
      return NextResponse.json(
        { error: "Shopify is not configured. Please add your store domain and API key in Integrations." },
        { status: 400 }
      );
    }

    const storeDomain = settings.shopify_store_domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const apiKey = settings.shopify_api_key;

    // Fetch recent orders from Shopify Admin API
    const shopifyUrl = `https://${storeDomain}/admin/api/2024-01/orders.json?status=any&limit=50`;
    
    const response = await fetch(shopifyUrl, {
      headers: {
        "X-Shopify-Access-Token": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Shopify API error:", response.status, errText);
      return NextResponse.json(
        { error: `Shopify API returned ${response.status}: ${errText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const { orders } = await response.json();
    if (!orders || !Array.isArray(orders)) {
      return NextResponse.json({ error: "Invalid response from Shopify" }, { status: 500 });
    }

    let synced = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const order of orders) {
      try {
        // Extract customer info
        const customerData = order.customer;
        if (!customerData?.phone && !customerData?.default_address?.phone) {
          skipped++;
          continue;
        }

        const phone = (customerData.phone || customerData.default_address?.phone || "").replace(/[\s\-\(\)\.]/g, "");
        if (!phone || phone.length < 7) {
          skipped++;
          continue;
        }

        const customerName = `${customerData.first_name || ""} ${customerData.last_name || ""}`.trim() || "Unknown";

        // Upsert Customer
        const customer = await prisma.customer.upsert({
          where: { phone },
          update: {
            shopify_customer_id: String(customerData.id),
            name: customerName,
            email: customerData.email || undefined,
          },
          create: {
            shopify_customer_id: String(customerData.id),
            name: customerName,
            phone,
            email: customerData.email || undefined,
          },
        });

        // Build line items
        const lineItems = (order.line_items || []).map((item: any) => ({
          name: item.name,
          qty: item.quantity,
          price: item.price,
          product_id: String(item.product_id),
        }));

        // Get tracking info
        const trackingNumber =
          order.fulfillments?.length > 0
            ? order.fulfillments[0].tracking_number
            : null;

        // Determine delivery status
        let deliveryStatus = "pending";
        let deliveredAt = null;
        if (order.fulfillment_status === "fulfilled") {
          deliveryStatus = "delivered";
          deliveredAt = order.fulfillments?.[0]?.created_at ? new Date(order.fulfillments[0].created_at) : new Date();
        }

        // Upsert Order
        const dbOrder = await prisma.order.upsert({
          where: { shopify_order_id: String(order.id) },
          update: {
            fulfillment_status: order.fulfillment_status || "unfulfilled",
            tracking_number: trackingNumber || undefined,
            delivery_status: deliveryStatus,
            delivered_at: deliveredAt || undefined,
          },
          create: {
            customer_id: customer.id,
            shopify_order_id: String(order.id),
            order_number: order.name,
            line_items: JSON.stringify(lineItems),
            total_price: parseFloat(order.total_price) || 0,
            fulfillment_status: order.fulfillment_status || "unfulfilled",
            tracking_number: trackingNumber,
            delivery_status: deliveryStatus,
            ordered_at: new Date(order.created_at),
            delivered_at: deliveredAt,
            source: "shopify",
          },
        });

        // Create follow-up tasks for delivered orders
        if (deliveryStatus === "delivered" && deliveredAt) {
          const reviewDate = new Date(deliveredAt);
          reviewDate.setDate(reviewDate.getDate() + settings.review_offset_days);

          const reorderDate = new Date(deliveredAt);
          reorderDate.setDate(reorderDate.getDate() + settings.reorder_offset_days);

          const existingTasks = await prisma.task.findMany({
            where: { order_id: dbOrder.id },
          });
          const types = existingTasks.map((t) => t.task_type);

          if (!types.includes("review")) {
            await prisma.task.create({
              data: {
                order_id: dbOrder.id,
                customer_id: customer.id,
                task_type: "review",
                due_date: reviewDate,
              },
            });
          }

          if (!types.includes("reorder")) {
            await prisma.task.create({
              data: {
                order_id: dbOrder.id,
                customer_id: customer.id,
                task_type: "reorder",
                due_date: reorderDate,
              },
            });
          }
        }

        // Update customer stats
        const orderCount = await prisma.order.count({ where: { customer_id: customer.id } });
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            total_orders: orderCount,
            last_order_date: new Date(order.created_at),
            segment: orderCount >= 3 ? "repeat" : orderCount >= 2 ? "returning" : "one_time",
          },
        });

        synced++;
      } catch (orderErr: any) {
        errors.push(`Order ${order.name}: ${orderErr.message}`);
      }
    }

    // Log the sync
    await prisma.syncLog.create({
      data: {
        status: errors.length > 0 ? "partial" : "success",
        error: errors.length > 0 ? errors.join("; ") : null,
      },
    });

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: orders.length,
      errors: errors.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Shopify sync error:", error);

    await prisma.syncLog.create({
      data: {
        status: "error",
        error: error.message,
      },
    });

    return NextResponse.json(
      { error: error.message || "Shopify sync failed" },
      { status: 500 }
    );
  }
}
