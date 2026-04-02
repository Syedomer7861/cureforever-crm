"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
      headers: { "Content-Type": "application/json" },
    });
    setSaving(false);
    alert("Settings Saved successfully!");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "number" ? parseInt(e.target.value, 10) : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  if (!settings) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Configure your follow-up timings and integrations.</p>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Timing Engine</CardTitle>
              <CardDescription>Adjust the days after 'Delivered' when tasks are scheduled.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="review_offset_days">Review Call Offset (Days)</Label>
                <Input 
                  type="number" 
                  id="review_offset_days" 
                  name="review_offset_days" 
                  value={settings.review_offset_days} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorder_offset_days">Reorder Call Offset (Days)</Label>
                <Input 
                  type="number" 
                  id="reorder_offset_days" 
                  name="reorder_offset_days" 
                  value={settings.reorder_offset_days} 
                  onChange={handleChange} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inactive_threshold_days">Inactive Customer Threshold (Days)</Label>
                <Input 
                  type="number" 
                  id="inactive_threshold_days" 
                  name="inactive_threshold_days" 
                  value={settings.inactive_threshold_days} 
                  onChange={handleChange} 
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </form>
      </div>
    </main>
  );
}
