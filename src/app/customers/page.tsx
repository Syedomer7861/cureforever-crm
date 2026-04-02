import { prisma } from "@/lib/prisma";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: any }) {
  const search = searchParams.q || "";

  const customers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
      ],
    },
    orderBy: {
        created_at: "desc"
    }
  });

  return (
    <main className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Customers</h1>
            <p className="text-gray-500 mt-1">Manage and search your customer base.</p>
          </div>
          <form className="w-full md:w-64">
            <Input 
              name="q" 
              placeholder="Search by name or phone..." 
              defaultValue={search}
            />
          </form>
        </header>

        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>RTO Status</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-gray-500">{c.phone}</TableCell>
                  <TableCell>
                    <Badge variant={
                      c.segment === 'repeat' ? 'default' : 
                      c.segment === 'inactive' ? 'destructive' : 'secondary'
                    }>
                      {c.segment.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.rto_flag ? (
                      <Badge variant="outline" className="text-red-500 border-red-500 font-bold">RTO RISKY ({c.rto_count})</Badge>
                    ) : (
                      <span className="text-gray-400 text-xs">Safe</span>
                    )}
                  </TableCell>
                  <TableCell>{c.total_orders}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/customers/${c.id}`}>
                      <span className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer">View Profile →</span>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {customers.length === 0 && (
              <div className="p-8 text-center text-gray-500 italic">No customers found.</div>
          )}
        </div>
      </div>
    </main>
  );
}
