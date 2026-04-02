"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<any[]>([]);

  // Since it's a client component, let's fetch tasks.
  // In a real app we might use server components with suspense
  useEffect(() => {
    fetch("/api/tasks/calendar")
      .then((res) => res.json())
      .then((data) => setTasks(data.tasks || []));
  }, []);

  const getDayTasks = (d: Date | undefined) => {
    if (!d) return [];
    return tasks.filter((t) => {
      const taskDate = new Date(t.due_date);
      return (
        taskDate.getDate() === d.getDate() &&
        taskDate.getMonth() === d.getMonth() &&
        taskDate.getFullYear() === d.getFullYear()
      );
    });
  };

  const selectedDayTasks = getDayTasks(date);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Task Calendar</h1>
          <p className="text-gray-500 mt-1">Visualize your follow-up schedule and workload.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="flex justify-center p-6 bg-white overflow-hidden shadow-sm">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow p-4 w-full h-full text-lg scale-110 origin-top"
              modifiers={{
                hasTask: tasks.map(t => new Date(t.due_date))
              }}
              modifiersClassNames={{
                hasTask: "font-black underline decoration-green-500 decoration-2 underline-offset-4"
              }}
            />
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold bg-white p-4 shadow-sm border rounded-lg">
              Tasks for {date ? date.toDateString() : "Selected Day"}
            </h2>

            {selectedDayTasks.length === 0 ? (
              <p className="text-gray-500 italic p-4">No tasks due on this date.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {selectedDayTasks.map((t) => (
                  <Card key={t.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-md">{t.customer?.name}</CardTitle>
                        <Badge variant={t.task_type === "review" ? "secondary" : "default"}>
                          {t.task_type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p>Phone: {t.customer?.phone}</p>
                      <p>Status: <Badge variant="outline">{t.status}</Badge></p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
