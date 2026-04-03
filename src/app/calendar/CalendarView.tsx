"use client";

import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "@/components/TaskCard";

export function CalendarView({ initialTasks }: { initialTasks: any[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [tasks, setTasks] = useState<any[]>(initialTasks);

  // Update local tasks state if initialTasks changes (on router.refresh)
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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
                  <TaskCard key={t.id} task={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
