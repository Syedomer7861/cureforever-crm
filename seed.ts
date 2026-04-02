import "dotenv/config";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clear existing
  await prisma.callLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  // Create Dummy Customer
  const cust1 = await prisma.customer.create({
    data: {
      name: "John Doe",
      phone: "+919876543210",
      email: "john@example.com",
    }
  });

  const cust2 = await prisma.customer.create({
    data: {
      name: "Jane Smith",
      phone: "+919876543211",
      email: "jane@example.com",
    }
  });

  // Create Dummy Orders
  const order1 = await prisma.order.create({
    data: {
        customer_id: cust1.id,
        order_number: "#1001",
        line_items: JSON.stringify([{name: "Protein Powder", qty: 1}]),
        ordered_at: new Date(),
        delivery_status: "delivered",
        delivered_at: new Date(),
    }
  });

  const order2 = await prisma.order.create({
    data: {
        customer_id: cust2.id,
        order_number: "#1002",
        line_items: JSON.stringify([{name: "Creatine", qty: 2}]),
        ordered_at: new Date(),
        delivery_status: "delivered",
        delivered_at: new Date(),
    }
  });

  // Create Dummy Tasks: One due today, one overdue, one upcoming
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.task.create({
    data: {
        order_id: order1.id,
        customer_id: cust1.id,
        task_type: "review",
        due_date: today,
        status: "pending"
    }
  });

  await prisma.task.create({
    data: {
        order_id: order2.id,
        customer_id: cust2.id,
        task_type: "review",
        due_date: yesterday,
        status: "pending"
    }
  });

  await prisma.task.create({
    data: {
        order_id: order1.id,
        customer_id: cust1.id,
        task_type: "reorder",
        due_date: tomorrow,
        status: "pending"
    }
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
