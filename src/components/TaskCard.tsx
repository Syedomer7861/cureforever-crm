"use client";

import { completeTask, rescheduleTask, skipTask } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { differenceInDays, format, isToday, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";

export function TaskCard({ task }: { task: any }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleComplete = async () => {
    setLoading(true);
    await completeTask(task.id, "done", note);
    setLoading(false);
    router.refresh();
  };

  const handleSkip = async () => {
    setLoading(true);
    await skipTask(task.id, note || "Skipped from dashboard");
    setLoading(false);
    router.refresh();
  };

  let productName = "Unknown Product";
  try {
    const items = JSON.parse(task.order?.line_items || "[]");
    if (items && items.length > 0) {
      productName = items[0].name || "Unknown Product";
    }
  } catch (e) {
    // ignore
  }

  const productTemplate = productName.length > 40 ? productName.substring(0, 40) + "..." : productName;

  const dueDate = startOfDay(new Date(task.due_date));
  const today = startOfDay(new Date());
  const daysDiff = differenceInDays(dueDate, today);
  
  let dateText = "";
  let dateColor = "text-gray-500";
  if (isToday(dueDate)) {
    dateText = "Due Today!";
    dateColor = "text-amber-600 font-bold";
  } else if (daysDiff < 0) {
    dateText = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} (${format(dueDate, 'MMM d')})`;
    dateColor = "text-red-600 font-bold";
  } else {
    dateText = `Call scheduled in ${daysDiff} day${daysDiff > 1 ? 's' : ''} (${format(dueDate, 'MMM d')})`;
    dateColor = "text-emerald-600 font-medium";
  }

  return (
    <Card className="mb-4 shadow-sm border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{task.customer.name}</CardTitle>
            <p className={`text-xs mt-1 ${dateColor}`}>{dateText}</p>
          </div>
          <div className="flex items-center gap-2">
            {task.task_type === 'review' && task.order?.delivered_at && (() => {
               const daysSinceDelivery = differenceInDays(startOfDay(new Date()), startOfDay(new Date(task.order.delivered_at)));
               if (daysSinceDelivery >= 2 && daysSinceDelivery <= 3) {
                 return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 animate-pulse text-[10px] h-5 px-1.5 font-bold italic">Perfect Timing</Badge>
               }
               return null;
            })()}
            <Badge 
              variant={task.task_type === 'review' ? 'secondary' : 'default'} 
              className={`ml-2 mt-1 ${task.task_type === 'review' ? 'bg-purple-100 text-purple-800 border-purple-200' : ''}`}
            >
              {task.task_type.toUpperCase()}
            </Badge>
          </div>

        </div>
        <a 
          href={`tel:${task.customer.phone}`} 
          className="text-sm text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1 mt-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          {task.customer.phone}
        </a>
      </CardHeader>
      <CardContent className="pb-2 text-sm space-y-2">
        <p className="flex items-center gap-1 text-gray-700">
          <strong>Email:</strong> {task.customer.email ? (
            <a href={`mailto:${task.customer.email}`} className="text-blue-600 hover:underline">{task.customer.email}</a>
          ) : (
            <span className="text-gray-400 italic">Not provided</span>
          )}
        </p>

        <div className="my-2 p-3 bg-gray-50 rounded border border-gray-100">
          <p className="mb-1 text-gray-800">
            <strong>Product:</strong> {productTemplate}
          </p>
          <a href={`https://cureforever.in/search?q=${encodeURIComponent(productName)}`} target="_blank" rel="noreferrer" className="text-xs text-emerald-600 hover:underline">
            View Product ↗
          </a>
          <p className="mt-2 text-xs text-gray-500">
            <strong>Last ordered:</strong> {task.order.ordered_at ? new Date(task.order.ordered_at).toLocaleDateString() : 'N/A'} 
          </p>
        </div>

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
