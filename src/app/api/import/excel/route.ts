import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Parse various date formats from Excel
 */
function parseDate(value: any): Date | null {
  if (!value) return null;

  // Excel serial date number
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    if (!isNaN(date.getTime())) return date;
  }

  const str = String(value).trim();
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  // DD/MM/YYYY or DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const d = new Date(`${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Sanitize phone number
 */
function sanitizePhone(phone: any): string | null {
  if (!phone) return null;
  let str = String(phone).trim().replace(/[\s\-\(\)\.]/g, "");
  if (str.startsWith("+91") && str.length > 10) str = str.slice(3);
  else if (str.startsWith("91") && str.length > 10) str = str.slice(2);
  if (str.startsWith("0") && str.length > 10) str = str.slice(1);
  if (str.length < 7) return null;
  return str;
}

/**
 * Extract a mapped value from a row using the column mapping
 */
function getMappedValue(row: any, mapping: Record<string, string>, targetField: string): any {
  const col = Object.entries(mapping).find(([, field]) => field === targetField);
  if (!col) return undefined;
  return row[col[0]];
}

export async function POST(req: Request) {
  try {
    const { rows, mapping, customNames } = await req.json();
    const customs = customNames || {};
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows data provided" }, { status: 400 });
    }

    // If no mapping provided, use legacy column names
    const useMapping = mapping && typeof mapping === "object" && Object.keys(mapping).length > 0;

    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }
    
    // Fetch all Product overrides into memory mapped for fast lookup
    const productOverrides = await prisma.productOverride.findMany();

    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        // Extract values using mapping or legacy column names
        let name: any, rawPhone: any, email: any, address: any, city: any, state: any, zip: any, notes: any;
        let orderNumber: any, productName: any, deliveryDateRaw: any, orderDateRaw: any;
        let totalPrice: any, trackingNumber: any, deliveryStatusRaw: any;

        let orderMetadata: Record<string, any> = {};

        if (useMapping) {
          name = getMappedValue(row, mapping, "name");
          rawPhone = getMappedValue(row, mapping, "phone") || getMappedValue(row, mapping, "alternate_phone");
          email = getMappedValue(row, mapping, "email");
          const addr1 = getMappedValue(row, mapping, "address");
          const addr2 = getMappedValue(row, mapping, "address_line_2");
          address = addr1 && addr2 ? `${addr1}, ${addr2}` : addr1 || addr2;
          city = getMappedValue(row, mapping, "city");
          state = getMappedValue(row, mapping, "state");
          zip = getMappedValue(row, mapping, "zip");
          notes = getMappedValue(row, mapping, "notes");
          orderNumber = getMappedValue(row, mapping, "order_number");
          productName = getMappedValue(row, mapping, "product_name");
          deliveryDateRaw = getMappedValue(row, mapping, "delivery_date");
          orderDateRaw = getMappedValue(row, mapping, "order_date");
          totalPrice = getMappedValue(row, mapping, "total_price");
          trackingNumber = getMappedValue(row, mapping, "tracking_number");
          deliveryStatusRaw = getMappedValue(row, mapping, "delivery_status");

          // Extract all extra Shiprocket fields or "custom" fields into metadata
          const coreFields = [
            "name", "phone", "email", "address", "address_line_2", "city", "state", "zip", "notes", 
            "order_number", "product_name", "delivery_date", "order_date", 
            "total_price", "tracking_number", "delivery_status", "alternate_phone", "skip"
          ];

          for (const [colName, fieldType] of Object.entries(mapping)) {
            // value is what the user mapped this column to, e.g. "custom" or "rto_risk"
            const fieldVal = String(fieldType);
            if (row[colName] === undefined || row[colName] === "" || row[colName] === null) continue;

            if (fieldVal === "custom") {
              const customLabel = customs[colName] || colName;
              orderMetadata[customLabel] = row[colName];
            } else if (!coreFields.includes(fieldVal)) {
              // Standard Shiprocket field (e.g. "cod_charges", "zone", "payment_method")
              orderMetadata[fieldVal] = row[colName];
            }
          }
        } else {
          // Legacy fallback
          name = row["Customer Name"] || row["Name"] || row["customer_name"] || row["name"];
          rawPhone = row["Phone Number"] || row["Phone"] || row["phone_number"] || row["phone"] || row["Mobile"];
          email = row["Email"] || row["email"];
          address = row["Address"] || row["address"];
          city = row["City"] || row["city"];
          state = row["State"] || row["state"];
          zip = row["ZIP"] || row["Pincode"] || row["zip"];
          notes = row["Notes"] || row["notes"];
          orderNumber = row["Order ID"] || row["Order"] || row["order_id"] || row["Order Number"];
          productName = row["Product Name"] || row["Product"] || row["product_name"];
          deliveryDateRaw = row["Delivery Date"] || row["Delivered At"] || row["delivery_date"];
          orderDateRaw = row["Order Date"] || row["order_date"];
          totalPrice = row["Total Price"] || row["Amount"] || row["total_price"];
          trackingNumber = row["Tracking Number"] || row["AWB"] || row["tracking_number"];
          deliveryStatusRaw = row["Delivery Status"] || row["delivery_status"];
        }

        const phone = sanitizePhone(rawPhone);
        if (!phone) {
          errors.push(`Row ${rowNum}: Missing or invalid phone number`);
          continue;
        }
        if (!name) {
          errors.push(`Row ${rowNum}: Missing customer name`);
          continue;
        }

        const nameStr = String(name).trim();
        const emailStr = email ? String(email).trim() : undefined;
        const addressStr = address ? String(address).trim() : undefined;
        const cityStr = city ? String(city).trim() : undefined;
        const stateStr = state ? String(state).trim() : undefined;
        const zipStr = zip ? String(zip).trim() : undefined;
        const notesStr = notes ? String(notes).trim() : undefined;

        // Upsert Customer with ALL available fields
        const customer = await prisma.customer.upsert({
          where: { phone },
          update: {
            name: nameStr,
            ...(emailStr ? { email: emailStr } : {}),
            ...(addressStr ? { address: addressStr } : {}),
            ...(cityStr ? { city: cityStr } : {}),
            ...(stateStr ? { state: stateStr } : {}),
            ...(zipStr ? { zip: zipStr } : {}),
            ...(notesStr ? { notes: notesStr } : {}),
          },
          create: {
            name: nameStr,
            phone,
            ...(emailStr ? { email: emailStr } : {}),
            ...(addressStr ? { address: addressStr } : {}),
            ...(cityStr ? { city: cityStr } : {}),
            ...(stateStr ? { state: stateStr } : {}),
            ...(zipStr ? { zip: zipStr } : {}),
            ...(notesStr ? { notes: notesStr } : {}),
          },
        });

        // Create order if we have order data
        const orderStr = orderNumber ? String(orderNumber).trim() : null;
        const deliveryDate = parseDate(deliveryDateRaw);
        const orderDate = parseDate(orderDateRaw);
        const price = totalPrice ? parseFloat(String(totalPrice).replace(/[₹$,]/g, "")) : undefined;
        const trackStr = trackingNumber ? String(trackingNumber).trim() : undefined;

        let deliveryStatus = "pending";
        if (deliveryStatusRaw) {
          const ds = String(deliveryStatusRaw).toLowerCase().trim();
          if (ds.includes("delivered") || ds === "delivered") deliveryStatus = "delivered";
          else if (ds.includes("rto") || ds === "rto") deliveryStatus = "rto";
          else if (ds.includes("transit") || ds.includes("shipped")) deliveryStatus = "in_transit";
        } else if (deliveryDate) {
          deliveryStatus = "delivered";
        }

        if (orderStr || productName || deliveryDate) {
          const finalOrderNum = orderStr || `IMP-${Date.now()}-${rowNum}`;

          let order = await prisma.order.findFirst({
            where: { customer_id: customer.id, order_number: finalOrderNum },
          });

          if (!order) {
            order = await prisma.order.create({
              data: {
                customer_id: customer.id,
                order_number: finalOrderNum,
                line_items: JSON.stringify([{
                  name: productName ? String(productName).trim() : "Imported Product",
                  qty: 1,
                  ...(price ? { price } : {}),
                }]),
                total_price: price || undefined,
                delivery_status: deliveryStatus,
                tracking_number: trackStr || undefined,
                ordered_at: orderDate || deliveryDate || new Date(),
                delivered_at: deliveryDate || undefined,
                source: "excel",
                metadata: Object.keys(orderMetadata).length > 0 ? (orderMetadata as any) : null,
              } as any,
            });
          }

          // Generate Tasks if delivered
          if (deliveryStatus === "delivered" && (deliveryDate || orderDate)) {
            const baseDate = deliveryDate || orderDate!;
            
            const prodNameStr = productName ? String(productName).trim() : "";
            const override = productOverrides.find(o => o.product_name === prodNameStr);
            
            const reviewDays = override?.review_offset_days ?? settings.review_offset_days;
            const reorderDays = override?.reorder_offset_days ?? settings.reorder_offset_days;

            const reviewDate = new Date(baseDate);
            reviewDate.setDate(reviewDate.getDate() + reviewDays);

            const reorderDate = new Date(baseDate);
            reorderDate.setDate(reorderDate.getDate() + reorderDays);

            const existingTasks = await prisma.task.findMany({ where: { order_id: order.id } });
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

          // Handle RTO
          if (deliveryStatus === "rto") {
            await prisma.customer.update({
              where: { id: customer.id },
              data: { rto_flag: true, rto_count: { increment: 1 } },
            });
          }
        }

        // Update customer stats
        const orderCount = await prisma.order.count({ where: { customer_id: customer.id } });
        const lastOrder = await prisma.order.findFirst({
          where: { customer_id: customer.id },
          orderBy: { ordered_at: "desc" },
        });

        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            total_orders: orderCount,
            last_order_date: lastOrder?.ordered_at || new Date(),
            segment: orderCount >= 3 ? "repeat" : orderCount >= 2 ? "returning" : "one_time",
          },
        });

        successCount++;
      } catch (rowErr: any) {
        errors.push(`Row ${rowNum}: ${rowErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      count: successCount,
      total: rows.length,
      errors: errors.slice(0, 30),
      skipped: rows.length - successCount,
    });
  } catch (err: any) {
    console.error("Excel import error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
