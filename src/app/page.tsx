import { prisma } from "@/lib/prisma";
import { TaskCard } from "@/components/TaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Fetch Tasks
  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["pending", "rescheduled"] },
    },
    include: {
      customer: true,
      order: true,
    },
    orderBy: {
      due_date: "asc",
    },
  });

  const dueToday = tasks.filter((t) => t.due_date >= today && t.due_date < tomorrow);
  const overdue = tasks.filter((t) => t.due_date < today);
  const upcoming = tasks.filter((t) => t.due_date >= tomorrow);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Agent Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your follow-ups today.</p>
        </header>

        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="today">Today ({dueToday.length})</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="today" className="space-y-4">
            {dueToday.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks due today. Great job!</p>
            ) : (
              dueToday.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdue.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No overdue tasks.</p>
            ) : (
              overdue.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {upcoming.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming tasks scheduled yet.</p>
            ) : (
              upcoming.map((task) => (
                <div key={task.id} className="opacity-75 pointer-events-none">
                  <TaskCard task={task} />
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
