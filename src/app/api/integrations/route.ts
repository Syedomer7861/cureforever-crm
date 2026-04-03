import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET integration status (without exposing secrets)
export async function GET() {
  try {
    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }

    return NextResponse.json({
      shopify: {
        connected: !!(settings.shopify_store_domain && settings.shopify_api_key),
        store_domain: settings.shopify_store_domain || "",
      },
      shiprocket: {
        connected: !!(settings.shiprocket_email),
        email: settings.shiprocket_email || "",
      },
      whatsapp: {
        connected: !!(settings.whatsapp_phone_id && settings.whatsapp_token),
        enabled: settings.whatsapp_enabled,
      },
    });
  } catch (error) {
    console.error("GET Integrations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH to update integration credentials
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { integration, ...data } = body;

    let settings = await prisma.setting.findFirst();
    if (!settings) {
      settings = await prisma.setting.create({ data: {} });
    }

    let updateData: any = {};

    if (integration === "shopify") {
      updateData = {
        shopify_store_domain: data.store_domain || null,
        shopify_api_key: data.api_key || null,
      };
    } else if (integration === "shiprocket") {
      updateData = {
        shiprocket_email: data.email || null,
        shiprocket_password: data.password || null,
      };
    } else if (integration === "whatsapp") {
      updateData = {
        whatsapp_phone_id: data.phone_id || null,
        whatsapp_token: data.token || null,
        whatsapp_enabled: data.enabled ?? settings.whatsapp_enabled,
      };
    } else {
      return NextResponse.json({ error: "Unknown integration" }, { status: 400 });
    }

    await prisma.setting.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH Integrations error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE to disconnect an integration
export async function DELETE(req: Request) {
  try {
    const { integration } = await req.json();
    
    let settings = await prisma.setting.findFirst();
    if (!settings) return NextResponse.json({ success: true });

    let updateData: any = {};

    if (integration === "shopify") {
      updateData = { shopify_store_domain: null, shopify_api_key: null };
    } else if (integration === "shiprocket") {
      updateData = { shiprocket_email: null, shiprocket_password: null };
    } else if (integration === "whatsapp") {
      updateData = { whatsapp_phone_id: null, whatsapp_token: null, whatsapp_enabled: false };
    }

    await prisma.setting.update({
      where: { id: settings.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Integration error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
