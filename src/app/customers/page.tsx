"use client";

import { useEffect, useState, Suspense } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Customers...</div>}>
      <CustomerListContent />
    </Suspense>
  );
}

function CustomerListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const search = searchParams?.get("q") || "";
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search); // local state for debouncing

  const fetchCustomers = async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setCustomers(data);
    } catch {
      toast.error("Failed to fetch customers");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== search) {
        router.push(`/customers?q=${encodeURIComponent(searchQuery)}`);
      }
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(customers.map((c) => c.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} customer(s)? This will also delete their related orders and tasks.`)) return;

    setDeleting(true);
    try {
      const res = await fetch("/api/customers/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success(`Deleted ${selectedIds.length} customers successfully`);
        setSelectedIds([]);
        fetchCustomers(search);
      } else {
        toast.error("Bulk delete failed");
      }
    } catch {
      toast.error("Network error during bulk delete");
    }
    setDeleting(false);
  };

  return (
    <main className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Customers</h1>
            <p className="text-gray-500 mt-1">Manage and search your customer base.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            {selectedIds.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleBulkDelete} 
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm"
              >
                {deleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
              </Button>
            )}
            <div className="w-full md:w-64">
              <Input 
                placeholder="Search by Name, Phone, Email..." 
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </header>

        <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={selectedIds.length === customers.length && customers.length > 0} 
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>RTO Status</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                   <TableCell colSpan={7} className="h-24 text-center text-gray-400">Loading customers...</TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={7} className="h-24 text-center text-gray-400 italic">No customers found.</TableCell>
                </TableRow>
              ) : customers.map((c) => (
                <TableRow key={c.id} className={selectedIds.includes(c.id) ? "bg-slate-50" : ""}>
                   <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(c.id)} 
                        onCheckedChange={() => toggleSelectOne(c.id)}
                      />
                   </TableCell>
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
        </div>
      </div>
    </main>
  );
}
