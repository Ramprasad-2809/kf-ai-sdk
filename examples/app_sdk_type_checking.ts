import { Roles, Order } from "../app";

// Example function demonstrating SDK usage
async function demonstrateSDKUsage() {
  const role = Roles.Admin;
  const order = new Order(role);

  // get api:
  const orderDetail = await order.get("order-id-123");
  orderDetail.profitMargin;

  // delete api:
  await order.delete("order-id-456");

  // create api:
  await order.create({
    _id: "010",
    customerId: "Claude",
    totalAmount: { currency: "USD", value: 250.75 },
    status: "completed",
    internalNotes: "Handle with care",
    profitMargin: 15,
  });

  let status = await order.update("010", { status: "completed" });
  status._id;

  // list api:
  const ordersList = await order.list();
  ordersList.Data.forEach((order) => {
    console.log(order._id, order.profitMargin);
  });
}

// Export for use
export { demonstrateSDKUsage };
