import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  if (!serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// GET all team members
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET Team error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - create a new team member
export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY not configured. Add it to your .env file." },
        { status: 500 }
      );
    }

    // Create user in Supabase Auth
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create in our DB
    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email,
        role: role || "agent",
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("POST Team error:", error);
    // Handle unique constraint
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A user with this email already exists in the CRM." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PATCH - update user role
export async function PATCH(req: Request) {
  try {
    const { id, role } = await req.json();

    if (!id || !role) {
      return NextResponse.json({ error: "User ID and role are required" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH Team error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE - remove a team member
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Delete from our DB
    await prisma.user.delete({ where: { id } });

    // Also delete from Supabase Auth
    const adminClient = getAdminClient();
    if (adminClient) {
      await adminClient.auth.admin.deleteUser(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Team error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
