import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const topic = req.headers.get("x-shopify-topic");
    if (!topic) {
      return NextResponse.json({ error: "Missing topic header" }, { status: 400 });
    }

    const payload = await req.json();

    if (topic === "orders/create" || topic === "orders/updated" || topic === "orders/fulfilled") {
      // Upsert Customer
      const customerData = payload.customer;
      if (!customerData || !customerData.phone) {
          // Required field for our CRM
          return NextResponse.json({ message: "Skipped: no customer phone" }, { status: 200 });
      }

      const customer = await prisma.customer.upsert({
        where: { phone: customerData.phone },
        update: {
          shopify_customer_id: customerData.id.toString(),
          name: `${customerData.first_name} ${customerData.last_name || ""}`.trim(),
          email: customerData.email,
        },
        create: {
          shopify_customer_id: customerData.id.toString(),
          name: `${customerData.first_name} ${customerData.last_name || ""}`.trim(),
          phone: customerData.phone,
          email: customerData.email,
        },
      });

      // Upsert Order
      const lineItems = payload.line_items.map((item: any) => ({
        name: item.name,
        qty: item.quantity,
        price: item.price,
        product_id: item.product_id,
      }));

      const trackingNumber =
        payload.fulfillments && payload.fulfillments.length > 0
          ? payload.fulfillments[0].tracking_number
          : null;

      await prisma.order.upsert({
        where: { shopify_order_id: payload.id.toString() },
        update: {
          fulfillment_status: payload.fulfillment_status || "unfulfilled",
          tracking_number: trackingNumber || undefined,
        },
        create: {
          customer_id: customer.id,
          shopify_order_id: payload.id.toString(),
          order_number: payload.name,
          line_items: JSON.stringify(lineItems),
          total_price: parseFloat(payload.total_price),
          fulfillment_status: payload.fulfillment_status || "unfulfilled",
          tracking_number: trackingNumber,
          ordered_at: new Date(payload.created_at),
        },
      });

      return NextResponse.json({ success: true });
    }

    // Customers create/update
    if (topic === "customers/create" || topic === "customers/update") {
      if (payload.phone) {
        await prisma.customer.upsert({
          where: { phone: payload.phone },
          update: {
            shopify_customer_id: payload.id.toString(),
            name: `${payload.first_name} ${payload.last_name || ""}`.trim(),
            email: payload.email,
          },
          create: {
            shopify_customer_id: payload.id.toString(),
            name: `${payload.first_name} ${payload.last_name || ""}`.trim(),
            phone: payload.phone,
            email: payload.email,
          },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ message: "Unhandled topic" });
  } catch (error) {
    console.error("Shopify webhook error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
