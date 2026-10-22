// Turns Flipdish orders into ChefStock Sales. Pure functions + one save, so the
// mapping can be tested with fake orders, no API needed.
const Sale = require("../../../backend/models/Sale");
const MenuItem = require("../models/MenuItem");

// Orders the customer actually received. Rejected, cancelled, refunded,
// unpaid or still-being-placed orders are saved but don't count.
const COUNTED_STATES = ["ReadyToProcess", "AcceptedByRestaurant", "Dispatched", "Delivered"];

// A Flipdish item with sizes ("Margherita" with "Slice / Half tray / Full tray")
// is ONE item with a "master" option. The size is part of what was sold,
// so it's part of the key.
const getFlipdishKey = (orderItem) => {
    const size = (orderItem.OrderItemOptions || []).find((option) => option.IsMasterOptionSetItem);
    return size ? `${orderItem.MenuItemId}:${size.MenuItemOptionId}` : String(orderItem.MenuItemId);
};

const getLineName = (orderItem) => {
    const size = (orderItem.OrderItemOptions || []).find((option) => option.IsMasterOptionSetItem);
    return size ? `${orderItem.Name} - ${size.Name}` : orderItem.Name;
};

// menuItemIdsByKey: Map of flipdishKey -> ChefStock MenuItem _id
const orderToSale = (order, restaurantId, menuItemIdsByKey) => ({
    restaurant: restaurantId,
    source: "flipdish",
    externalOrderId: String(order.OrderId),
    placedAt: new Date(order.PlacedTime),
    orderState: order.OrderState,
    counts: COUNTED_STATES.includes(order.OrderState),
    amount: order.Amount ?? 0,
    totalTax: order.TotalTax ?? 0,
    // Flipdish has no quantity field: two slices = two OrderItems.
    lines: (order.OrderItems || []).map((item) => {
        const flipdishKey = getFlipdishKey(item);
        return {
            flipdishKey,
            name: getLineName(item),
            price: item.PriceIncludingOptionSetItems ?? item.Price ?? 0,
            menuItem: menuItemIdsByKey.get(flipdishKey) ?? null,
        };
    }),
});

// A short, customer-free view of an order, for checking how the shop's
// Flipdish menu is set up (are sizes options? are two slices two lines?).
const describeOrder = (order) => ({
    orderId: order.OrderId,
    storeId: order.Store?.Id ?? null,
    placedTime: order.PlacedTime,
    orderState: order.OrderState,
    amount: order.Amount,
    items: (order.OrderItems || []).map((item) => ({
        flipdishKey: getFlipdishKey(item),
        name: item.Name,
        price: item.PriceIncludingOptionSetItems ?? item.Price,
        options: (item.OrderItemOptions || []).map((option) => ({
            id: option.MenuItemOptionId,
            name: option.Name,
            isSize: Boolean(option.IsMasterOptionSetItem),
        })),
    })),
});

// Saves orders, updating ones we already have (an order placed at 18:00 may be
// "Delivered" by the next sync). Returns how many were new vs updated.
const importOrders = async (orders, restaurantId, storeId) => {
    // Safety net: if Flipdish ever ignores the store filter, never import
    // another store's orders into this restaurant.
    orders = orders.filter((order) => !order.Store?.Id || order.Store.Id === storeId);

    const menuItems = await MenuItem.find({ restaurant: restaurantId, isActive: true, flipdishItemId: { $ne: "" } });
    const menuItemIdsByKey = new Map(menuItems.map((item) => [item.flipdishItemId, item._id]));

    const sales = orders.map((order) => orderToSale(order, restaurantId, menuItemIdsByKey));
    if (sales.length === 0) return { created: 0, updated: 0 };

    // One bulkWrite instead of hundreds of separate saves.
    const result = await Sale.bulkWrite(
        sales.map((sale) => ({
            updateOne: {
                filter: { restaurant: restaurantId, source: "flipdish", externalOrderId: sale.externalOrderId },
                update: { $set: sale },
                upsert: true,
            },
        }))
    );

    return { created: result.upsertedCount, updated: result.modifiedCount };
};

module.exports = { importOrders, orderToSale, describeOrder, getFlipdishKey, COUNTED_STATES };
