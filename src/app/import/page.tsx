"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// All possible CRM fields that can be mapped
const CRM_FIELDS = [
  { key: "skip", label: "— Skip this column —" },
  { key: "name", label: "Customer Name", required: true },
  { key: "phone", label: "Phone Number / Customer Mobile", required: true },
  { key: "email", label: "Email / Customer Email" },
  { key: "address", label: "Address / Address Line 1" },
  { key: "address_line_2", label: "Address Line 2" },
  { key: "city", label: "City / Address City" },
  { key: "state", label: "State / Address State" },
  { key: "zip", label: "ZIP / Pincode / Address Pincode" },
  { key: "notes", label: "Notes" },
  { key: "order_number", label: "Order ID / Order Number" },
  { key: "channel", label: "Channel" },
  { key: "courier_company", label: "Courier Company" },
  { key: "tracking_number", label: "Tracking / AWB Code" },
  { key: "delivery_status", label: "Status / Delivery Status" },
  { key: "delivery_date", label: "Order Delivered Date / Delivery Date" },
  { key: "product_sku", label: "Channel SKU" },
  { key: "product_name", label: "Product Name" },
  { key: "product_quantity", label: "Product Quantity" },
  { key: "order_date", label: "Channel Created At / Order Date" },
  { key: "alternate_phone", label: "Customer Alternate Phone" },
  { key: "payment_method", label: "Payment Method" },
  { key: "total_price", label: "Order Total / Total Price / Amount" },
  { key: "awb_assigned_date", label: "AWB Assigned Date" },
  { key: "pickup_address_name", label: "Pickup Address Name" },
  { key: "pickup_scheduled_date", label: "Pickup Scheduled Date" },
  { key: "cod_remittance_date", label: "COD Remittance Date" },
  { key: "cod_payable_amount", label: "COD Payable Amount" },
  { key: "remitted_amount", label: "Remitted Amount" },
  { key: "crf_id", label: "CRF ID" },
  { key: "utr_no", label: "UTR No" },
  { key: "zone", label: "Zone" },
  { key: "cod_charges", label: "COD Charges" },
  { key: "freight_total_amount", label: "Freight Total Amount" },
  { key: "rto_risk", label: "RTO Risk" },
  { key: "order_risk", label: "Order Risk" },
  { key: "address_risk", label: "Address Risk" },
  { key: "address_score", label: "Address Score" },
  { key: "custom", label: "➕ Add Custom Field" },
];

// Auto-detect mapping based on column name
function autoDetectField(colName: string): string {
  const col = colName.toLowerCase().trim();

  // Basic expanded regex detections
  if (/^(name|customer\s*name|buyer|full\s*name)$/i.test(col)) return "name";
  if (/^(phone|customer\s*mobile|mobile|contact|tel)$/i.test(col)) return "phone";
  if (/^(email|customer\s*email|e[\-\s]?mail)$/i.test(col)) return "email";
  if (/^(address|address\s*line\s*1|shipping\s*address)$/i.test(col)) return "address";
  if (/^(address\s*line\s*2)$/i.test(col)) return "address_line_2";
  if (/^(city|address\s*city|town)$/i.test(col)) return "city";
  if (/^(state|address\s*state|province|region)$/i.test(col)) return "state";
  if (/^(zip|pincode|address\s*pincode|pin\s*code|postal)$/i.test(col)) return "zip";
  if (/^(notes?|comment|remark)$/i.test(col)) return "notes";
  
  if (/^(order\s*id|order\s*number|order|order\s*no)$/i.test(col)) return "order_number";
  if (/^(channel)$/i.test(col)) return "channel";
  if (/^(courier\s*company|courier)$/i.test(col)) return "courier_company";
  if (/^(awb\s*code|awb|tracking|tracking\s*number)$/i.test(col)) return "tracking_number";
  if (/^(status|delivery\s*status|fulfillment|delivery)$/i.test(col)) return "delivery_status";
  if (/^(order\s*delivered\s*date|delivery\s*date)$/i.test(col)) return "delivery_date";
  if (/^(channel\s*sku|sku)$/i.test(col)) return "product_sku";
  if (/^(product\s*name|product|item)$/i.test(col)) return "product_name";
  if (/^(product\s*quantity|quantity|qty)$/i.test(col)) return "product_quantity";
  if (/^(channel\s*created\s*at|order\s*date)$/i.test(col)) return "order_date";
  if (/^(customer\s*alternate\s*phone|alt\s*phone|alternate\s*number)$/i.test(col)) return "alternate_phone";
  if (/^(payment\s*method|payment)$/i.test(col)) return "payment_method";
  if (/^(order\s*total|total|amount|revenue|total\s*price)$/i.test(col)) return "total_price";

  // Exact matching for deeply specific Shiprocket/others
  const mappings: Record<string, string> = {
    "awb assigned date": "awb_assigned_date",
    "pickup address name": "pickup_address_name",
    "pickup scheduled date": "pickup_scheduled_date",
    "cod remittance date": "cod_remittance_date",
    "cod payble amount": "cod_payable_amount",
    "cod payable amount": "cod_payable_amount",
    "remitted amount": "remitted_amount",
    "crf id": "crf_id",
    "utr no": "utr_no",
    "zone": "zone",
    "cod charges": "cod_charges",
    "freight total amount": "freight_total_amount",
    "rto risk": "rto_risk",
    "order risk": "order_risk",
    "address risk": "address_risk",
    "address score": "address_score"
  };

  if (mappings[col]) return mappings[col];

  // Default
  return "skip";
}

export default function ImportPage() {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Try different header row offsets to handle title/merged rows
        // Score is how many columns auto-detected as non-skip
        let bestData: any[] = [];
        let bestCols: string[] = [];
        let bestScore = -1;

        for (let offset = 0; offset <= 3; offset++) {
          const candidate = XLSX.utils.sheet_to_json(ws, { range: offset });
          if (candidate.length === 0) continue;
          const cols = Object.keys(candidate[0] as object);
          const score = cols.filter(c => autoDetectField(c) !== "skip").length;
          if (score > bestScore || bestScore === -1) {
            bestScore = score;
            bestData = candidate;
            bestCols = cols;
          }
        }

        if (bestData.length > 0) {
          setColumns(bestCols);
          const autoMap: Record<string, string> = {};
          bestCols.forEach((col) => { autoMap[col] = autoDetectField(col); });
          setMapping(autoMap);
          setStep("map");
        }
        setData(bestData);
      } catch {
        alert("Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.");
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const updateMapping = (col: string, field: string) => {
    setMapping((prev) => ({ ...prev, [col]: field }));
  };

  const hasMapped = (field: string) => Object.values(mapping).includes(field);
  const hasRequiredFields = hasMapped("name") && hasMapped("phone");

  const handleImport = async () => {
    setUploading(true);
    setResult(null);
    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: data, mapping, customNames }),
      });
      const json = await res.json();

      if (res.ok) {
        setResult({
          success: true,
          count: json.count,
          total: json.total,
          skipped: json.skipped,
          errors: json.errors || [],
        });
        if (json.count > 0) {
          toast.success(`Successfully imported ${json.count} rows!`, {
            description: "New data is ready. Refresh the dashboard to see updated analytics.",
            action: {
              label: "Refresh Dashboard",
              onClick: () => window.location.href = "/reports"
            },
            duration: 10000
          });
          setData([]);
          setColumns([]);
          setFileName("");
          setMapping({});
          setStep("upload");
        } else {
          toast.warning("Import connected but 0 records were processed. Check mapping/errors.");
        }
      } else {
        toast.error(json.error || "Import failed. Check your data format.");
        setResult({
          success: false,
          error: json.error || "Import failed. Check your data format.",
        });
      }
    } catch {
      toast.error("Network error during upload.");
      setResult({ success: false, error: "Network error during upload." });
    }
    setUploading(false);
  };

  const resetAll = () => {
    setData([]);
    setColumns([]);
    setMapping({});
    setCustomNames({});
    setFileName("");
    setResult(null);
    setStep("upload");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Excel Import</h1>
          <p className="text-gray-500 mt-1">Upload any Excel file — we&apos;ll auto-detect columns and let you map them to CRM fields.</p>
        </header>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {["upload", "map", "preview"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === s ? "bg-emerald-600 text-white" :
                (["upload", "map", "preview"].indexOf(step) > i) ? "bg-emerald-100 text-emerald-700" :
                "bg-gray-200 text-gray-500"
              }`}>
                {i + 1}
              </div>
              <span className={`font-medium capitalize ${step === s ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="p-10 border-2 border-dashed border-gray-300 rounded-2xl bg-white flex flex-col items-center justify-center gap-4 hover:border-emerald-400 transition-colors">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-700">Upload your Excel file</p>
              <p className="text-sm text-gray-400 mt-1">Any .xlsx or .xls — we&apos;ll detect columns automatically</p>
            </div>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-5 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
            />
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-emerald-600" />
                Parsing...
              </div>
            )}
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === "map" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Map Columns</span>
                  <Badge variant="secondary">{fileName} — {data.length} rows</Badge>
                </CardTitle>
                <CardDescription>
                  We auto-detected your columns. Adjust the mapping if needed. Name and Phone are required.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {columns.map((col) => {
                    const sampleValues = data.slice(0, 3).map(r => r[col]).filter(Boolean).join(", ");
                    return (
                      <div key={col} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 border">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-800 truncate">{col}</p>
                          <p className="text-xs text-gray-400 truncate">e.g. {sampleValues || "—"}</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div className="flex flex-col gap-2">
                          <select
                            value={mapping[col] || "skip"}
                            onChange={(e) => updateMapping(col, e.target.value)}
                            className={`w-48 text-sm border rounded-lg px-3 py-2 ${
                              mapping[col] && mapping[col] !== "skip"
                                ? "border-emerald-300 bg-emerald-50 text-emerald-800 font-medium"
                                : "border-gray-200 bg-white text-gray-600"
                            }`}
                          >
                            {CRM_FIELDS.map((f) => (
                              <option key={f.key} value={f.key} disabled={f.key !== "skip" && f.key !== "custom" && f.key !== mapping[col] && hasMapped(f.key)}>
                                {f.label} {f.required ? "*" : ""}
                              </option>
                            ))}
                          </select>
                          {mapping[col] === "custom" && (
                            <input
                              type="text"
                              placeholder="e.g. Lead Source"
                              value={customNames[col] || ""}
                              onChange={(e) => setCustomNames((prev) => ({ ...prev, [col]: e.target.value }))}
                              className="w-48 text-sm border rounded-lg px-3 py-1.5 border-emerald-300 bg-emerald-50/50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!hasRequiredFields && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    ⚠️ Please map at least <strong>Customer Name</strong> and <strong>Phone Number</strong> to continue.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={resetAll}>← Back</Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!hasRequiredFields}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
              >
                Continue to Preview →
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Preview & Import */}
        {step === "preview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Preview ({data.length} records)</span>
                  <Badge variant="secondary">{fileName}</Badge>
                </CardTitle>
                <CardDescription>
                  Mapped fields: {Object.entries(mapping).filter(([, v]) => v !== "skip").map(([col, v]) =>
                    v === "custom" ? customNames[col] || "Custom Field" : CRM_FIELDS.find(f => f.key === v)?.label
                  ).join(", ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <div className="max-h-80 overflow-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 sticky top-0">
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          {Object.entries(mapping).filter(([, v]) => v !== "skip").map(([col, field]) => (
                            <TableHead key={col} className="text-xs">
                              <span className="text-emerald-600 font-bold">
                                {field === "custom" ? customNames[col] || "Custom Field" : CRM_FIELDS.find(f => f.key === field)?.label}
                              </span>
                              <br />
                              <span className="text-gray-400 font-normal">{col}</span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.slice(0, 15).map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-gray-400 text-xs">{i + 1}</TableCell>
                            {Object.entries(mapping).filter(([, v]) => v !== "skip").map(([col]) => (
                              <TableCell key={col} className="text-sm">
                                {row[col] !== undefined ? String(row[col]).substring(0, 40) : "—"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Showing up to 15 rows. All {data.length} will be imported.</p>
              </CardContent>
            </Card>

            {/* Result */}
            {result && (
              <Card className={result.success ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}>
                <CardContent className="pt-6">
                  {result.success ? (
                    <div className="space-y-2">
                      <p className="font-bold text-emerald-800">
                        ✅ Import completed! {result.count} of {result.total} records imported.
                      </p>
                      {result.skipped > 0 && (
                        <p className="text-sm text-amber-700">⚠️ {result.skipped} rows skipped.</p>
                      )}
                      {result.errors?.length > 0 && (
                        <div className="mt-2 text-sm text-red-700 space-y-1 max-h-40 overflow-auto">
                          {result.errors.map((err: string, i: number) => (
                            <p key={i} className="text-xs font-mono">• {err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="font-bold text-red-800">❌ {result.error}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("map")}>← Edit Mapping</Button>
              <Button
                onClick={handleImport}
                disabled={uploading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                size="lg"
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    Importing {data.length} records...
                  </span>
                ) : (
                  `Confirm & Import All (${data.length} records)`
                )}
              </Button>
              <Button variant="outline" onClick={resetAll}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
