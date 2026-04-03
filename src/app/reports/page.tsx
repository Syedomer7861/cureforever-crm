"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);

  const fetchData = () => {
    setStats(null);
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data) => setStats(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const downloadCSV = () => {
    if (!stats || !stats.logs) return;
    
    const headers = ["ID", "Customer", "Phone", "Email", "Order Number", "Product Name", "Task Type", "Agent", "Outcome", "Note", "Date"];
    const rows = stats.logs.map((log: any) => {
      let productName = "Unknown";
      try {
        const items = JSON.parse(log.task?.order?.line_items || "[]");
        if (items && items.length > 0) productName = items[0].name || "Unknown";
      } catch (e) {}

      return [
        log.id,
        `"${(log.customer?.name || "").replace(/"/g, '""')}"`,
        log.customer?.phone || "N/A",
        log.customer?.email || "N/A",
        log.task?.order?.order_number || "N/A",
        `"${productName.replace(/"/g, '""')}"`,
        log.task?.task_type || "N/A",
        log.agent_name || "System",
        log.outcome,
        `"${(log.note || "").replace(/"/g, '""')}"`,
        new Date(log.called_at).toLocaleString()
      ];
    });

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

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );

  const totalOrders = stats.totalOrders || 0;
  const rtoOrders = stats.rtoOrders || 0;
  const rtoRate = totalOrders > 0 ? ((rtoOrders / totalOrders) * 100).toFixed(1) : "0.0";
  const charts = stats.charts || {};

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-500 mt-1">Deep dive into your revenue, orders, and courier performance.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" className="bg-white hover:bg-gray-100 border-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
              Refresh Data
            </Button>
            <Button onClick={downloadCSV} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export Call Logs (CSV)
            </Button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Customers</p>
              <div className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</div>
              <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1">
                ↑ Active user base
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
              <div className="text-3xl font-bold text-gray-900">{totalOrders}</div>
              <p className="text-xs text-gray-400 mt-2">All time processed</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 mb-1">Completed Calls</p>
              <div className="text-3xl font-bold text-blue-600">{stats.completedCalls}</div>
              <p className="text-xs text-gray-400 mt-2">Agent productivity</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-full translate-x-8 -translate-y-8" />
            <CardContent className="p-6 relative">
              <p className="text-sm font-medium text-gray-500 mb-1">Business RTO Rate</p>
              <div className="text-3xl font-bold text-red-600">{rtoRate}%</div>
              <p className="text-xs text-red-400 mt-2 font-medium">{rtoOrders} Returns tracked</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: Revenue / Trends */}
          <Card className="col-span-1 lg:col-span-2 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Revenue Insights</CardTitle>
              <CardDescription>Daily total revenue based on imported data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                {charts.revenueChart && charts.revenueChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `₹${val.toLocaleString()}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`₹${Number(value || 0).toLocaleString()}`, 'Revenue']}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">No revenue data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Side Chart: Delivery Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Delivery Status</CardTitle>
              <CardDescription>Current state of all imported orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full flex flex-col justify-center">
                {charts.statusChart && charts.statusChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.statusChart}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {charts.statusChart.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name === 'delivered' ? '#10b981' : 
                            entry.name === 'rto' ? '#ef4444' : 
                            entry.name === 'in_transit' ? '#f59e0b' : '#3b82f6'
                          } />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [value, 'Orders']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">No status data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Courier Distribution */}
           <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Courier Performance</CardTitle>
              <CardDescription>Volume handled by each shipping partner</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {charts.courierChart && charts.courierChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.courierChart} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [value, 'Orders']}
                      />
                      <Bar dataKey="value" name="Orders" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                        {charts.courierChart.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">No courier data available</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Built-in RTO Risk Chart */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>RTO Risk Segmentation</CardTitle>
              <CardDescription>Order volume mapped by Shiprocket Risk Scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {charts.rtoRiskChart && charts.rtoRiskChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.rtoRiskChart.filter((c:any)=>c.name !== "Unscored")} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                      <RechartsTooltip 
                        cursor={{ fill: '#F3F4F6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [value, 'Orders']}
                      />
                      <Bar dataKey="value" name="Orders" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60}>
                       {charts.rtoRiskChart.filter((c:any)=>c.name !== "Unscored").map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.name.toLowerCase().includes('high') ? '#ef4444' : 
                            entry.name.toLowerCase().includes('medium') ? '#f59e0b' : '#10b981'
                          } />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">No RTO risk data available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Agent Performance Section */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
            <CardDescription>Total completed calls per agent (Target achievement)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {charts.agentChart && charts.agentChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.agentChart} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                     <RechartsTooltip 
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                     />
                     <Bar dataKey="done" name="Calls Completed" radius={[6, 6, 0, 0]} maxBarSize={50}>
                        {charts.agentChart.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 italic">No agent productivity data logged yet.</div>
              )}
            </div>

            {/* Detailed Performance Table */}
            {charts.agentChart && charts.agentChart.length > 0 && (
              <div className="mt-8 overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50/50 text-gray-500 uppercase text-xs font-semibold">
                    <tr>
                      <th className="px-6 py-4">Agent Name</th>
                      <th className="px-6 py-4 text-center">Total Effort</th>
                      <th className="px-6 py-4 text-center">Completed (Done)</th>
                      <th className="px-6 py-4 text-center">Skipped</th>
                      <th className="px-6 py-4 text-center">Rescheduled</th>
                      <th className="px-6 py-4 text-right">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {charts.agentChart.map((agent: any, idx: number) => {
                      const successRate = agent.total > 0 ? ((agent.done / agent.total) * 100).toFixed(1) : "0.0";
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{agent.name}</td>
                          <td className="px-6 py-4 text-center font-medium">{agent.total}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              {agent.done}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-gray-500">{agent.skipped}</td>
                          <td className="px-6 py-4 text-center text-gray-500">{agent.rescheduled}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-bold text-slate-900">{successRate}%</span>
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full" 
                                  style={{ width: `${successRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
