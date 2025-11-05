import { Roles, Order } from "../app/index";

const role = Roles.Admin;

const order = new Order(role);

// get api:
const orderDetail = await order.get("order-id-123");
orderDetail.profitMargin;

// delete api:
await order.delete("order-id-456");

// create api:
const newOrder = await order.create({
  id: "010",
  customerId: "Claude",
  totalAmount: 250,
  status: "completed",
  createdAt: new Date(),
  updatedAt: new Date(),
  internalNotes: "Handle with care",
  profitMargin: 15,
});

// list api:
const ordersList = await order.list();
ordersList.Data.forEach((order) => {
  console.log(order.id, order.profitMargin);
});
