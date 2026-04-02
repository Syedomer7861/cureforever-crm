"use client";

import { completeTask, rescheduleTask, skipTask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function TaskCard({ task }: { task: any }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    await completeTask(task.id, "done", note);
    setLoading(false);
  };

  const handleSkip = async () => {
    setLoading(true);
    await skipTask(task.id, note || "Skipped from dashboard");
    setLoading(false);
  };

  return (
    <Card className="mb-4 shadow-sm border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{task.customer.name}</CardTitle>
          <Badge variant={task.task_type === 'review' ? 'secondary' : 'default'}>
            {task.task_type.toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-500">{task.customer.phone}</p>
      </CardHeader>
      <CardContent className="pb-2 text-sm">
        <p><strong>Order:</strong> {task.order.order_number || task.order.shopify_order_id}</p>
        <p><strong>Status:</strong> {task.order.delivery_status}</p>
        <div className="mt-4">
          <Input 
            placeholder="Add a call note..." 
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            disabled={loading}
          />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={handleComplete} disabled={loading} size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
            Mark Done
        </Button>
        <Button onClick={handleSkip} disabled={loading} size="sm" variant="outline" className="w-full">
            Skip
        </Button>
      </CardFooter>
    </Card>
  );
}
