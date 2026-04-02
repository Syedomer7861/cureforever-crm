import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.setting.findFirst();

    if (!settings || !settings.whatsapp_enabled || !settings.whatsapp_phone_id) {
      return NextResponse.json({ message: "WhatsApp digest is disabled or missing details" });
    }

    // Find tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueToday = await prisma.task.count({
      where: {
        status: { in: ["pending", "rescheduled"] },
        due_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const bodyText = `Daily Digest Preview: You have ${dueToday} follow-up calls due today! Open Cureforever CRM to process them.`;

    // Only attempt fetch if token exists
    if (settings.whatsapp_token) {
      // Send message via Meta Cloud API 
      // POST https://graph.facebook.com/v18.0/${PHONE_ID}/messages
      const response = await fetch(`https://graph.facebook.com/v18.0/${settings.whatsapp_phone_id}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${settings.whatsapp_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          // The owner will message their own 'To' phone number usually or defined elsewhere, just using template payload example
          to: settings.whatsapp_phone_id, 
          type: "text",
          text: {
            preview_url: false,
            body: bodyText
          }
        })
      });

      if (!response.ok) {
        console.error("WhatsApp API Error:", await response.text());
        return NextResponse.json({ success: false, message: "Meta API rejected request" });
      }
    } else {
      console.log(`[WhatsApp Simulation] To ${settings.whatsapp_phone_id}: ${bodyText}`);
    }

    return NextResponse.json({ success: true, count: dueToday });
  } catch (err) {
    console.error("Digest error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
