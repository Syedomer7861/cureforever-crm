"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type IntegrationStatus = {
  shopify: { connected: boolean; store_domain: string };
  shiprocket: { connected: boolean; email: string };
  whatsapp: { connected: boolean; enabled: boolean };
};

export default function IntegrationsPage() {
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  // Shopify form
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyApiKey, setShopifyApiKey] = useState("");
  const [savingShopify, setSavingShopify] = useState(false);

  // Shiprocket form
  const [shiprocketEmail, setShiprocketEmail] = useState("");
  const [shiprocketPassword, setShiprocketPassword] = useState("");
  const [savingShiprocket, setSavingShiprocket] = useState(false);

  // WhatsApp form
  const [waPhoneId, setWaPhoneId] = useState("");
  const [waToken, setWaToken] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    const res = await fetch("/api/integrations");
    const data = await res.json();
    setStatus(data);
    if (data.shopify?.store_domain) setShopifyDomain(data.shopify.store_domain);
    if (data.shiprocket?.email) setShiprocketEmail(data.shiprocket.email);
  };

  const saveShopify = async () => {
    setSavingShopify(true);
    await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        integration: "shopify",
        store_domain: shopifyDomain,
        api_key: shopifyApiKey,
      }),
    });
    setShopifyApiKey("");
    await fetchStatus();
    setSavingShopify(false);
  };

  const disconnectIntegration = async (integration: string) => {
    if (!confirm(`Disconnect ${integration}? This will remove stored credentials.`)) return;
    await fetch("/api/integrations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ integration }),
    });
    await fetchStatus();
  };

  const saveShiprocket = async () => {
    setSavingShiprocket(true);
    await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        integration: "shiprocket",
        email: shiprocketEmail,
        password: shiprocketPassword,
      }),
    });
    setShiprocketPassword("");
    await fetchStatus();
    setSavingShiprocket(false);
  };

  const saveWhatsapp = async () => {
    setSavingWhatsapp(true);
    await fetch("/api/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        integration: "whatsapp",
        phone_id: waPhoneId,
        token: waToken,
      }),
    });
    setWaToken("");
    await fetchStatus();
    setSavingWhatsapp(false);
  };

  const triggerShopifySync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/integrations/shopify", { method: "POST" });
      const data = await res.json();
      setSyncResult(data);
    } catch {
      setSyncResult({ error: "Network error during sync" });
    }
    setSyncing(false);
  };

  if (!status) {
    return <div className="p-8 text-center text-gray-500">Loading integrations...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Integrations</h1>
          <p className="text-gray-500 mt-1">Connect your tools to automate order tracking, follow-ups, and notifications.</p>
        </header>

        {/* Shopify */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-700" viewBox="0 0 24 24" fill="currentColor"><path d="M15.337 3.136a.49.49 0 00-.472-.139c-.02.007-2.093.637-2.093.637a53.33 53.33 0 00-.754-.228c-.37-1.075-1.025-2.065-2.178-2.065h-.1C9.408.906 8.996.564 8.518.564c-2.502 0-3.705 3.13-4.08 4.722-.975.302-1.668.517-1.756.546-.548.172-.565.189-.637.707C2.006 6.89.5 18.373.5 18.373L15.8 21l.003-17.838a.493.493 0 00-.466-.026zm-3.985 1.327l-2.286.71c.22-.856.641-1.712 1.154-2.27.192-.209.463-.44.78-.58.317.667.362 1.61.352 2.14zm-1.667-2.88c.255 0 .464.085.642.253-.928.436-1.926 1.537-2.347 3.737l-1.81.561c.504-1.714 1.671-4.55 3.515-4.55zm.59 13.06c-.066-.035-1.57-.846-1.57-.846s.678-4.712.678-4.766c.017-.11.065-.239.175-.239.11 0 2.095 1.383 2.095 1.383s-1.312 4.432-1.378 4.468z"/></svg>
                </div>
                <div>
                  <CardTitle>Shopify</CardTitle>
                  <CardDescription>Sync orders and customers from your Shopify store.</CardDescription>
                </div>
              </div>
              <Badge variant={status.shopify.connected ? "default" : "outline"} className={status.shopify.connected ? "bg-green-600" : ""}>
                {status.shopify.connected ? "✓ Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {status.shopify.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="text-sm font-medium text-green-800">Connected to {status.shopify.store_domain}</p>
                    <p className="text-xs text-green-600">Webhook URL: {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/shopify</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => disconnectIntegration("shopify")}>
                    Disconnect
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={triggerShopifySync} disabled={syncing} className="flex-1">
                    {syncing ? "Syncing Orders..." : "⟳ Sync Orders Now"}
                  </Button>
                </div>
                {syncResult && (
                  <div className={`p-3 rounded-lg text-sm ${syncResult.error ? "bg-red-50 text-red-800 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
                    {syncResult.error ? (
                      <p>❌ {syncResult.error}</p>
                    ) : (
                      <div>
                        <p>✅ Synced {syncResult.synced} orders ({syncResult.skipped} skipped, {syncResult.total} total)</p>
                        {syncResult.errors?.length > 0 && (
                          <div className="mt-1 text-xs">
                            {syncResult.errors.map((e: string, i: number) => <p key={i}>• {e}</p>)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Store Domain</Label>
                  <Input
                    placeholder="yourstore.myshopify.com"
                    value={shopifyDomain}
                    onChange={(e) => setShopifyDomain(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Admin API Access Token</Label>
                  <Input
                    type="password"
                    placeholder="shpat_xxxxxxxxxxxxxxxxx"
                    value={shopifyApiKey}
                    onChange={(e) => setShopifyApiKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Get this from Shopify Admin → Settings → Apps → Develop Apps → Create/Select App → API Credentials
                  </p>
                </div>
                <Button onClick={saveShopify} disabled={savingShopify || !shopifyDomain || !shopifyApiKey} className="w-full">
                  {savingShopify ? "Connecting..." : "Connect Shopify"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shiprocket */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <CardTitle>Shiprocket</CardTitle>
                  <CardDescription>Track deliveries and auto-update order status via webhooks.</CardDescription>
                </div>
              </div>
              <Badge variant={status.shiprocket.connected ? "default" : "outline"} className={status.shiprocket.connected ? "bg-blue-600" : ""}>
                {status.shiprocket.connected ? "✓ Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {status.shiprocket.connected ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Connected as {status.shiprocket.email}</p>
                    <p className="text-xs text-blue-600">Webhook URL: {typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/shiprocket</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => disconnectIntegration("shiprocket")}>
                    Disconnect
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">Delivery tracking</p>
                    <p className="font-bold text-green-600">Active</p>
                  </div>
                  <div className="p-2 rounded bg-gray-50 text-center">
                    <p className="text-xs text-gray-500">RTO detection</p>
                    <p className="font-bold text-green-600">Active</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Shiprocket Email</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={shiprocketEmail}
                    onChange={(e) => setShiprocketEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shiprocket Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={shiprocketPassword}
                    onChange={(e) => setShiprocketPassword(e.target.value)}
                  />
                </div>
                <Button onClick={saveShiprocket} disabled={savingShiprocket || !shiprocketEmail || !shiprocketPassword} className="w-full">
                  {savingShiprocket ? "Connecting..." : "Connect Shiprocket"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <CardTitle>WhatsApp</CardTitle>
                  <CardDescription>Send automated notifications to customers — review requests, reorder reminders.</CardDescription>
                </div>
              </div>
              <Badge variant={status.whatsapp.connected ? "default" : "outline"} className={status.whatsapp.connected ? "bg-emerald-600" : ""}>
                {status.whatsapp.connected ? "✓ Connected" : "Not Connected"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {status.whatsapp.connected ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <p className="text-sm font-medium text-emerald-800">WhatsApp Business API connected</p>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200" onClick={() => disconnectIntegration("whatsapp")}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>WhatsApp Phone Number ID</Label>
                  <Input
                    placeholder="Enter phone number ID"
                    value={waPhoneId}
                    onChange={(e) => setWaPhoneId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter access token"
                    value={waToken}
                    onChange={(e) => setWaToken(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">
                    Get these from Meta Business → WhatsApp → API Setup
                  </p>
                </div>
                <Button onClick={saveWhatsapp} disabled={savingWhatsapp || !waPhoneId || !waToken} className="w-full">
                  {savingWhatsapp ? "Connecting..." : "Connect WhatsApp"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
