"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ImportPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const parsedData = XLSX.utils.sheet_to_json(ws);
      setData(parsedData);
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: data }),
      });
      if (res.ok) {
        alert("Import successful! Tasks have been queued.");
        setData([]);
      } else {
        alert("Import failed.");
      }
    } catch (err) {
      alert("Error occurred during upload.");
    }
    setUploading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Excel Batch Import</h1>
          <p className="text-gray-500 mt-1">Upload your historic .xlsx file to automatically populate customers and create follow-up tasks.</p>
        </header>

        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white flex flex-col items-center justify-center">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
            className="block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
        </div>

        {loading && <p>Parsing Excel file...</p>}

        {data.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Preview ({data.length} records)</h2>
            <div className="rounded-md border bg-white overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Order #</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Delivered</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row["Customer Name"] || row["Name"]}</TableCell>
                      <TableCell>{row["Phone Number"] || row["Phone"]}</TableCell>
                      <TableCell>{row["Order ID"] || row["Order"]}</TableCell>
                      <TableCell>{row["Product Name"] || row["Product"]}</TableCell>
                      <TableCell>{row["Delivery Date"] || row["Delivered At"]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-sm text-gray-500">* Showing up to 10 rows for preview.</p>

            <Button onClick={handleImport} disabled={uploading} className="w-full">
              {uploading ? "Importing to Database..." : "Confirm & Import All"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
