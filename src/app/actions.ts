"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function completeTask(taskId: string, outcome: string, note: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { customer: true }});
  if (!task) throw new Error("Task not found");

  // Mark task as done
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "done",
      completed_at: new Date(),
    },
  });

  // Log the call
  await prisma.callLog.create({
    data: {
      task_id: taskId,
      customer_id: task.customer.id,
      outcome,
      note,
    },
  });

  revalidatePath("/");
}

export async function rescheduleTask(taskId: string, newDate: Date, reason: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { customer: true }});
  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "rescheduled",
      rescheduled_to: newDate,
    },
  });

  await prisma.callLog.create({
    data: {
      task_id: taskId,
      customer_id: task.customer.id,
      outcome: "rescheduled",
      note: `Rescheduled to ${newDate.toDateString()}: ${reason}`,
    },
  });

  revalidatePath("/");
}

export async function skipTask(taskId: string, reason: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { customer: true } });
  if (!task) throw new Error("Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: "skipped",
    },
  });

  await prisma.callLog.create({
    data: {
      task_id: taskId,
      customer_id: task.customer.id,
      outcome: "skipped",
      note: reason,
    },
  });

  revalidatePath("/");
}
