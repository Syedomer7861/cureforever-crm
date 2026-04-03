import { prisma } from "@/lib/prisma";
import { CalendarView } from "./CalendarView";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  // Fetch all pending tasks with customer/order details
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

  return <CalendarView initialTasks={tasks} />;
}
