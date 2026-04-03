import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { differenceInDays, startOfDay } from "date-fns";


export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: any }) {
  const search = searchParams.q || "";

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { order_number: { contains: search } },
        { tracking_number: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ],
    },
    include: {
      customer: true,
    },
    orderBy: {
      ordered_at: "desc",
    },
  });

  return (
    <main className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Orders</h1>
            <p className="text-gray-500 mt-1">Global view of all synced Shopify and Import orders.</p>
          </div>
          <form className="w-full md:w-64">
            <Input 
              name="q" 
              placeholder="Search by Order #, AWB, Name..." 
              defaultValue={search}
            />
          </form>
        </header>

        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery Status</TableHead>
                <TableHead>Tracking (AWB)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-bold">{o.order_number}</TableCell>
                  <TableCell>
                    <Link href={`/customers/${o.customer_id}`}>
                      <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline underline-offset-2">
                        {o.customer.name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(o.ordered_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-gray-600 font-normal">
                      {o.fulfillment_status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      o.delivery_status === 'delivered' ? 'default' : 
                      o.delivery_status === 'rto' ? 'destructive' : 'secondary'
                    }>
                      {o.delivery_status.toUpperCase()}
                    </Badge>
                    {o.delivery_status === 'delivered' && o.delivered_at && (() => {
                      const daysSinceDelivery = differenceInDays(startOfDay(new Date()), startOfDay(new Date(o.delivered_at)));
                      if (daysSinceDelivery >= 2 && daysSinceDelivery <= 3) {
                        return (
                          <Badge className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm animate-pulse">
                            REVIEW CALL
                          </Badge>
                        );
                      }
                      return null;
                    })()}

                  </TableCell>
                  <TableCell className="text-xs text-slate-500">{o.tracking_number || 'No AWB'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 && (
              <div className="p-8 text-center text-gray-500 italic">No orders found matching your search.</div>
          )}
        </div>
      </div>
    </main>
  );
}
