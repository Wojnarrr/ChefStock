// Turns Flipdish orders into ChefStock Sales. Pure functions + one save, so the
// mapping can be tested with fake orders, no API needed.
const Sale = require("../models/Sale");
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

// The same kind of customer-free view, for a sale from the newer Sales API.
// Modifiers can contain modifiers (e.g. size -> extra topping), so this is recursive.
const describeModifiers = (modifiers = []) =>
    modifiers.map((modifier) => ({
        id: modifier.modifierItemId,
        name: modifier.modifierItemName,
        quantity: modifier.quantity,
        unitPrice: modifier.unitPrice,
        modifiers: describeModifiers(modifier.modifierItems),
    }));

const describeSale = (entry) => ({
    saleId: entry.saleId,
    channel: entry.salesChannelType, // e.g. "POS", "KIOSK", "UberEats"
    source: entry.source ?? entry.sale?.source ?? "",
    status: entry.sale?.status,
    createdAt: entry.createdAt,
    total: entry.sale?.totalSaleAmount,
    items: (entry.sale?.items || []).map((item) => ({
        menuItemId: item.menuItemId,
        name: item.menuItemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        modifiers: describeModifiers(item.modifierItems),
    })),
});

// ---------------------------------------------------------------------------
// The newer Sales API (till + online)
// ---------------------------------------------------------------------------

// Sales the customer actually got. Pending, rejected, cancelled and fully
// refunded sales are saved but don't count.
const COUNTED_SALE_STATUSES = [
    "SALE_ACCEPTED",
    "SALE_PREPARED_BY_KITCHEN",
    "SALE_DISPATCHED",
    "SALE_ON_THE_WAY",
    "SALE_DELIVERED",
    "SALE_PARTIALLY_REFUNDED",
];

// The Sales API doesn't mark which option is the size, so we recognise it by
// name. Your online menu uses "Half Tray"; add words here if your menu uses others.
const SIZE_WORDS = /\b(slice|half|full|tray|whole|small|medium|large|regular)\b/i;

const findSize = (item) => (item.modifierItems || []).find((modifier) => SIZE_WORDS.test(modifier.modifierItemName || ""));

const getSaleItemKey = (item) => {
    const size = findSize(item);
    return size ? `${item.menuItemId}:${size.modifierItemId}` : item.menuItemId;
};

// What one unit costs, including every option (and the options' options).
const unitPriceWithModifiers = (item) =>
    (item.unitPrice || 0) +
    (item.modifierItems || []).reduce(
        (sum, modifier) => sum + unitPriceWithModifiers(modifier) * (modifier.quantity || 1),
        0
    );

const saleToRecord = (entry, restaurantId, menuItemIdsByKey) => {
    const sale = entry.sale || {};

    return {
        restaurant: restaurantId,
        source: "flipdish-sales",
        externalOrderId: entry.saleId,
        channel: entry.salesChannelType || "",
        placedAt: new Date(sale.creationTime || entry.createdAt),
        orderState: sale.status || "UNKNOWN",
        counts: COUNTED_SALE_STATUSES.includes(sale.status),
        amount: sale.totalSaleAmount ?? 0,
        totalTax: sale.totalTax ?? 0,
        lines: (sale.items || []).map((item) => {
            const flipdishKey = getSaleItemKey(item);
            const size = findSize(item);
            return {
                flipdishKey,
                name: size ? `${item.menuItemName} - ${size.modifierItemName}` : item.menuItemName || "Unnamed item",
                price: Math.round(unitPriceWithModifiers(item) * 100) / 100,
                quantity: item.quantity || 1,
                menuItem: menuItemIdsByKey.get(flipdishKey) ?? null,
            };
        }),
    };
};

const importSales = async (entries, restaurantId, propertyId) => {
    // Same safety net as for orders: only this shop's sales.
    entries = entries.filter((entry) => !entry.propertyId || entry.propertyId === propertyId);

    const menuItems = await MenuItem.find({ restaurant: restaurantId, isActive: true, flipdishItemId: { $ne: "" } });
    const menuItemIdsByKey = new Map(menuItems.map((item) => [item.flipdishItemId, item._id]));

    const records = entries.map((entry) => saleToRecord(entry, restaurantId, menuItemIdsByKey));
    if (records.length === 0) return { created: 0, updated: 0, byChannel: {} };

    const result = await Sale.bulkWrite(
        records.map((record) => ({
            updateOne: {
                filter: { restaurant: restaurantId, source: "flipdish-sales", externalOrderId: record.externalOrderId },
                update: { $set: record },
                upsert: true,
            },
        }))
    );

    const byChannel = {};
    for (const record of records) byChannel[record.channel || "unknown"] = (byChannel[record.channel || "unknown"] || 0) + 1;

    return { created: result.upsertedCount, updated: result.modifiedCount, byChannel };
};

module.exports = {
    importOrders,
    importSales,
    orderToSale,
    saleToRecord,
    describeOrder,
    describeSale,
    getFlipdishKey,
    getSaleItemKey,
    COUNTED_STATES,
    COUNTED_SALE_STATUSES,
};
