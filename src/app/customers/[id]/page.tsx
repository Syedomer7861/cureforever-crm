import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';
import { differenceInDays, startOfDay } from 'date-fns';


export const dynamic = "force-dynamic";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { ordered_at: "desc" } },
      call_logs: { include: { task: true }, orderBy: { called_at: "desc" } },
      tasks: { where: { status: "pending" }, orderBy: { due_date: "asc" } },
    },
  });

  if (!customer) {
    return <div className="p-16 text-center text-red-500 font-bold">Customer Not Found</div>;
  }

  return (
    <main className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-gray-900">{customer.name}</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-gray-500 font-medium text-lg mt-2">
              <p className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {customer.phone}
              </p>
              {customer.email && (
                <p className="flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">{customer.email}</a>
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="px-4 py-1 text-md bg-white">
              {customer.segment.toUpperCase()}
            </Badge>
            {customer.rto_flag && (
              <Badge variant="destructive" className="px-4 py-1 text-md">
                RTO RISKY
              </Badge>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500 tracking-wider">TOTAL ORDERS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customer.total_orders}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500 tracking-wider">ORDER VALUE</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₹{customer.orders.reduce((acc, o) => acc + (o.total_price || 0), 0)}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500 tracking-wider">LATEST ORDER</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-md font-bold">{customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString() : 'N/A'}</div>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-slate-500 tracking-wider">RTO HISTORY</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customer.rto_count} Orders</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none mb-6">
            <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-8">ORDERS</TabsTrigger>
            <TabsTrigger value="calls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-8">CALL LOGS</TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-8">UPCOMING TASKS</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders">
            <Card className="shadow-none border p-4 bg-white">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Delivery Status</TableHead>
                    <TableHead>Tracking</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customer.orders.map((o) => {
                    let productName = "Unknown Product";
                    try {
                      const items = JSON.parse(o.line_items || "[]");
                      if (items && items.length > 0) {
                        productName = items[0].name || "Unknown Product";
                      }
                    } catch (e) {
                      // ignore
                    }
                    const productTemplate = productName.length > 40 ? productName.substring(0, 40) + "..." : productName;

                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-bold">{o.order_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="font-medium text-gray-800">{productTemplate}</span>
                            <a href={`https://cureforever.in/search?q=${encodeURIComponent(productName)}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline w-fit">
                              View Product ↗
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(o.ordered_at).toLocaleDateString()}</TableCell>
                        <TableCell>₹{o.total_price}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{o.delivery_status.toUpperCase()}</Badge>
                          {o.delivery_status === 'delivered' && o.delivered_at && (() => {
                            const daysSinceDelivery = differenceInDays(startOfDay(new Date()), startOfDay(new Date(o.delivered_at)));
                            if (daysSinceDelivery >= 2 && daysSinceDelivery <= 3) {
                              return (
                                <Badge className="ml-2 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-sm animate-pulse">
                                  REVIEW CALL
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </TableCell>

                        <TableCell className="text-xs text-gray-500">
                          <div className="flex flex-col gap-1">
                            <span>{o.tracking_number || 'N/A'}</span>
                            {(o as any).metadata && Object.keys((o as any).metadata).length > 0 && (
                              <div className="mt-2 p-1.5 bg-slate-50 rounded border border-slate-100 text-[10px]">
                                <p className="font-bold mb-1 uppercase text-slate-400">Additional info:</p>
                                {Object.entries((o as any).metadata).map(([key, val]) => (
                                  <div key={key} className="flex gap-2">
                                    <span className="text-slate-500">{key.replace(/_/g, ' ')}:</span>
                                    <span className="text-slate-900 font-medium">{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="calls">
            <div className="space-y-4">
              {customer.call_logs.map((log) => (
                <Card key={log.id} className="shadow-sm border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-sm font-bold uppercase">{log.task?.task_type} Task Outcome: {log.outcome}</CardTitle>
                      <span className="text-xs text-gray-400">{new Date(log.called_at).toLocaleString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700">
                    {log.note || 'No notes recorded.'}
                    <p className="mt-2 text-xs text-gray-400">Agent: {log.agent_name || 'System'}</p>
                  </CardContent>
                </Card>
              ))}
              {customer.call_logs.length === 0 && (
                <div className="p-12 text-center text-gray-400">No calls have been logged yet for this customer.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks">
            <div className="space-y-4">
              {customer.tasks.map((task) => (
                <Card key={task.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-md uppercase underline">{task.task_type}</CardTitle>
                      <Badge>DUE: {new Date(task.due_date).toLocaleDateString()}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {task.task_type === 'review' ? 'Request product review after 5 days of delivery.' : 'Prompt customer for a reorder.'}
                  </CardContent>
                </Card>
              ))}
              {customer.tasks.length === 0 && (
                <div className="p-12 text-center text-gray-400">No pending follow-up tasks scheduled.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
