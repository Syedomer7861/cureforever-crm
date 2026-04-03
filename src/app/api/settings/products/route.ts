import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rules = await prisma.productOverride.findMany({
      orderBy: { created_at: "desc" }
    });

    // Fetch unique products from Orders
    const orders = await prisma.order.findMany({ select: { line_items: true } });
    const productNames = new Set<string>();
    
    orders.forEach(o => {
      try {
        const items = JSON.parse(o.line_items || "[]");
        if (Array.isArray(items)) {
          items.forEach(i => {
            if (i.name) productNames.add(String(i.name).trim());
          });
        }
      } catch (e) {
        // ignore malformed JSON
      }
    });

    return NextResponse.json({ 
      rules, 
      availableProducts: Array.from(productNames).sort() 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch product rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { product_names, review_offset_days, reorder_offset_days, final_offset_days } = data;

    if (!product_names || !Array.isArray(product_names) || product_names.length === 0) {
      return NextResponse.json({ error: "Product names required" }, { status: 400 });
    }

    const results = await prisma.$transaction(
      product_names.map((name: string) => 
        (prisma.productOverride as any).upsert({
          where: { product_name: name },
          update: {
            review_offset_days,
            reorder_offset_days,
            final_offset_days,
          },
          create: {
            product_name: name,
            review_offset_days,
            reorder_offset_days,
            final_offset_days,
          }
        })
      )
    );

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save product rule" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.productOverride.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete product rule" }, { status: 500 });
  }
}
