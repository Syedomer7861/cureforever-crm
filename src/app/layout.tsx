import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { logout } from "./login/actions";
import { Sidebar } from "@/components/Sidebar";
import { prisma } from "@/lib/prisma";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CureForever CRM",
  description: "Shopify + Shiprocket Logic-based CRM for Post-Delivery Revenue Recovery.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch role from DB
  let role = "agent";
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } }).catch(() => null);
    if (dbUser) {
      role = dbUser.role;
    } else {
      // Admin user exists in Supabase Auth but not in User table → treat as admin
      role = "admin";
    }
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col md:flex-row h-full" suppressHydrationWarning>
        {user ? (
          <>
            <Sidebar email={user.email || ""} role={role} logoutAction={logout} />
            <div className="flex-1 overflow-auto bg-gray-50 relative">
              {children}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-auto h-full relative">
            {children}
          </div>
        )}
        <Toaster richColors position="top-right" expand />
      </body>
    </html>
  );
}
