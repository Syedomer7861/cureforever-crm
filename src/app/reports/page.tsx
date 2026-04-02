"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setStats(data));
  }, []);

  const downloadCSV = () => {
    if (!stats || !stats.logs) return;
    
    const headers = ["ID", "Customer", "Phone", "Task Type", "Outcome", "Note", "Date"];
    const rows = stats.logs.map((log: any) => [
      log.id,
      log.customer?.name,
      log.customer?.phone,
      log.task?.task_type,
      log.outcome,
      `"${(log.note || "").replace(/"/g, '""')}"`, // escape quotes
      new Date(log.called_at).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any[]) => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "call_logs_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!stats) return <div className="p-8 text-center text-gray-500">Loading reports...</div>;

  const totalOrders = stats.totalOrders || 0;
  const rtoOrders = stats.rtoOrders || 0;
  const rtoRate = totalOrders > 0 ? ((rtoOrders / totalOrders) * 100).toFixed(1) : "0.0";

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-500 mt-1">Key performance metrics and call logs.</p>
          </div>
          <Button onClick={downloadCSV} variant="default">
            Download Call Logs (CSV)
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Completed Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.completedCalls}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Business RTO Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{rtoRate}%</div>
              <p className="text-xs text-gray-400 mt-1">{rtoOrders} out of {totalOrders} orders</p>
            </CardContent>
          </Card>
        </div>

      </div>
    </main>
  );
}
