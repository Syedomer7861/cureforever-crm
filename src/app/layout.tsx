import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-white p-6 shrink-0">
          <div className="mb-8 font-bold text-xl text-primary-foreground tracking-tight">CureForever CRM</div>
          <nav className="space-y-4">
            <a href="/" className="block hover:text-green-400 font-medium">Dashboard</a>
            <a href="/calendar" className="block hover:text-green-400 font-medium">Task Calendar</a>
            <a href="/customers" className="block hover:text-green-400 font-medium">Customers</a>
            <a href="/orders" className="block hover:text-green-400 font-medium">Orders</a>
            <a href="/import" className="block hover:text-green-400 font-medium">Excel Import</a>
            <a href="/reports" className="block hover:text-green-400 font-medium">Analytics</a>
            <a href="/settings" className="block hover:text-green-400 font-medium">Settings</a>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 overflow-auto bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}
