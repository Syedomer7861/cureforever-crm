"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Select from "react-select";
import { toast } from "sonner";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Product Rules state
  const [products, setProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<{label: string, value: string}[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any>([]);
  const [newReorderOffset, setNewReorderOffset] = useState<number>(20);
  const [savingProduct, setSavingProduct] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data));
      
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch("/api/settings/products")
      .then(res => res.json())
      .then(data => {
        setProducts(Array.isArray(data.rules) ? data.rules : []);
        if (Array.isArray(data.availableProducts)) {
          setAvailableProducts(data.availableProducts.map((p: string) => ({ label: p, value: p })));
        }
      });
  };

  const handleAddProduct = async () => {
    if (!selectedProducts || selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setSavingProduct(true);
    try {
      const names = selectedProducts.map((p: any) => p.value);
      const res = await fetch("/api/settings/products", {
        method: "POST",
        body: JSON.stringify({ product_names: names, reorder_offset_days: newReorderOffset }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success(`Rule added for ${names.length} product(s)`, {
          description: "New rules applied. Refresh the dashboard to see any recalculated stats.",
          action: { label: "Refresh", onClick: () => window.location.reload() }
        });
        setSelectedProducts([]);
        fetchProducts();
      } else {
        toast.error("Failed to save rules");
      }
    } catch {
      toast.error("Failed to save product.");
    }
    setSavingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remove this product rule?")) return;
    await fetch(`/api/settings/products?id=${id}`, { method: "DELETE" });
    fetchProducts();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const { id, created_at, updated_at, ...updateData } = settings;
      await fetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(updateData),
        headers: { "Content-Type": "application/json" },
      });
      setSaved(true);
      toast.success("Configuration updated", {
        description: "Your changes are live. Refresh to see the new timings reflected in analytics.",
        action: { label: "Refresh", onClick: () => window.location.reload() }
      });
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save settings.");
    }
    setSaving(false);
  };

  const handleResetAll = async () => {
    setResetting(true);
    try {
      const res = await fetch("/api/customers/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: ["ALL"] }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        toast.success("All CRM data has been purged successfully", {
          description: "Dashboard is now clean. Refresh to see empty stats.",
          action: { label: "Refresh Now", onClick: () => window.location.reload() }
        });
        setShowResetConfirm(false);
      } else {
        toast.error("Failed to reset data");
      }
    } catch {
      toast.error("Network error during reset");
    }
    setResetting(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsed: any = value;
    if (type === "number") {
      parsed = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(parsed)) parsed = 0;
    }
    setSettings({ ...settings, [name]: parsed });
  };

  if (!settings) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your follow-up timings and automation rules.</p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Timing Engine</CardTitle>
              <CardDescription>Adjust the days after &apos;Delivered&apos; when tasks are scheduled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review_offset_days">Review Call Offset (Days)</Label>
                <Input 
                  type="number" 
                  id="review_offset_days" 
                  name="review_offset_days" 
                  value={settings.review_offset_days ?? 0} 
                  onChange={handleChange} 
                  min={0}
                />
                <p className="text-xs text-gray-400">Days after delivery to schedule a review call.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_offset_days">Reorder Call Offset (Days)</Label>
                <Input 
                  type="number" 
                  id="reorder_offset_days" 
                  name="reorder_offset_days" 
                  value={settings.reorder_offset_days ?? 0} 
                  onChange={handleChange} 
                  min={0}
                />
                <p className="text-xs text-gray-400">Days after delivery to schedule a reorder reminder.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inactive_threshold_days">Inactive Customer Threshold (Days)</Label>
                <Input 
                  type="number" 
                  id="inactive_threshold_days" 
                  name="inactive_threshold_days" 
                  value={settings.inactive_threshold_days ?? 0} 
                  onChange={handleChange} 
                  min={0}
                />
                <p className="text-xs text-gray-400">Days without an order before a customer is marked inactive.</p>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : saved ? "✓ Saved Successfully" : "Save Global Configuration"}
          </Button>
        </form>

        <Card className="mt-8 border-indigo-100 shadow-sm border">
          <CardHeader className="bg-indigo-50/50">
            <CardTitle className="text-indigo-900">Per-Product Reorder Rules</CardTitle>
            <CardDescription className="text-indigo-700/80">Override the global reorder timeline for specific products. Matches by exact imported column name.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-1">
                <Label>Select Products (Multi-select)</Label>
                <Select
                  isMulti
                  placeholder="Select products from imported data..."
                  options={availableProducts}
                  value={selectedProducts}
                  onChange={setSelectedProducts}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: '#e2e8f0',
                      '&:hover': { borderColor: '#cbd5e1' }
                    })
                  }}
                />
              </div>
              <div className="w-48 space-y-1">
                <Label>Reorder in (Days)</Label>
                <Input type="number" value={newReorderOffset} onChange={e => setNewReorderOffset(parseInt(e.target.value, 10))} />
              </div>
              <Button onClick={handleAddProduct} disabled={savingProduct} className="bg-indigo-600 hover:bg-indigo-700">
                {savingProduct ? "Adding..." : "Add Rules"}
              </Button>
            </div>

            {products.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product Name</th>
                      <th className="px-4 py-3 font-medium">Reorder Target</th>
                      <th className="px-4 py-3 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map(p => (
                      <tr key={p.id} className="bg-white hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium">{p.product_name}</td>
                        <td className="px-4 py-3">
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold text-xs">
                            {p.reorder_offset_days} Days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteProduct(p.id)}>
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-6 border rounded border-dashed mt-4">No product overrides defined yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8 border-red-100 shadow-sm border bg-red-50/20">
          <CardHeader>
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
            <CardDescription className="text-red-700/80">Permanent destructive actions. Use with caution before real production imports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <p className="text-sm text-slate-600">
              Clear all customers, orders, tasks, and call logs from the database. Global settings and product rules will be preserved.
            </p>
            <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-800 font-bold uppercase mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                Warning
              </p>
              <p className="text-xs text-red-600 leading-relaxed font-medium">
                This action is irreversible. Use this only to clear test data before uploading real production records.
              </p>
            </div>
            {showResetConfirm ? (
              <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                 <p className="text-sm font-bold text-red-900 border-l-4 border-red-600 pl-3 py-1">Type "RESET" to confirm below (just kidding, just click the red button again):</p>
                 <div className="flex gap-2">
                   <Button 
                    variant="destructive" 
                    onClick={handleResetAll} 
                    disabled={resetting} 
                    className="flex-1 font-black underline decoration-2 underline-offset-4"
                  >
                    {resetting ? "Purging Database..." : "YES, DELETE EVERYTHING NOW"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowResetConfirm(false)} disabled={resetting}>
                    Cancel
                  </Button>
                 </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setShowResetConfirm(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold transition-all w-full"
              >
                Reset All CRM Data
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
