const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Sale = require("../models/Sale");
const { isConfigured, getStores, getOrders, getRecentOrders } = require("../../chefstock-flipdish/backend/services/flipdishClient");
const { importOrders, describeOrder } = require("../../chefstock-flipdish/backend/services/flipdishImport");

const DAY = 24 * 60 * 60 * 1000;
const FIRST_SYNC_DAYS = 30;
// Re-fetch the last 2 days each time, so orders that changed state
// (accepted -> delivered, or refunded) get updated.
const OVERLAP = 2 * DAY;

// GET /api/flipdish/status
// Is Flipdish set up, does the login work, which stores can it see?
const getStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.restaurantId);
        const status = {
            configured: isConfigured(),
            connected: false,
            error: null,
            stores: [],
            storeId: restaurant.flipdishStoreId,
            lastSyncAt: restaurant.flipdishLastSyncAt,
        };

        if (status.configured) {
            try {
                const stores = await getStores();
                status.connected = true;
                status.stores = stores.map((store) => ({
                    id: store.StoreId,
                    name: store.Name,
                    address: store.Address?.SingleLineDisplay || store.Address?.Line1 || "",
                }));
            } catch (error) {
                // A failed login isn't a server error: show it on the page instead.
                status.error = error.message;
            }
        }

        res.status(200).json(status);
    } catch (error) {
        res.status(500).json({ message: "Failed to check Flipdish", error: error.message });
    }
};

// PUT /api/flipdish/store   body: { storeId }
const setStore = async (req, res) => {
    try {
        const storeId = Number(req.body.storeId);

        if (!Number.isInteger(storeId) || storeId <= 0) {
            return res.status(400).json({ message: "Store id must be a whole number" });
        }

        const restaurant = await Restaurant.findById(req.restaurantId);

        // A different store means different orders: start the sync from scratch.
        if (restaurant.flipdishStoreId !== storeId) restaurant.flipdishLastSyncAt = null;
        restaurant.flipdishStoreId = storeId;
        await restaurant.save();

        res.status(200).json({ storeId });
    } catch (error) {
        res.status(400).json({ message: "Failed to save store", error: error.message });
    }
};

// POST /api/flipdish/sync
const syncSales = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.restaurantId);

        if (!restaurant.flipdishStoreId) {
            return res.status(400).json({ message: "Choose your Flipdish store first" });
        }

        const to = new Date();
        const from = restaurant.flipdishLastSyncAt
            ? new Date(restaurant.flipdishLastSyncAt.getTime() - OVERLAP)
            : new Date(to.getTime() - FIRST_SYNC_DAYS * DAY);

        const orders = await getOrders({ storeId: restaurant.flipdishStoreId, from, to });
        const { created, updated } = await importOrders(orders, restaurant._id, restaurant.flipdishStoreId);

        restaurant.flipdishLastSyncAt = to;
        await restaurant.save();

        res.status(200).json({ fetched: orders.length, created, updated, from, syncedAt: to });
    } catch (error) {
        res.status(502).json({ message: `Flipdish sync failed: ${error.message}` });
    }
};

// GET /api/flipdish/sample-orders
// The 3 most recent real orders, without customer details, to check how the
// shop's Flipdish menu is set up before trusting the import.
const getSampleOrders = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.restaurantId);

        if (!restaurant.flipdishStoreId) {
            return res.status(400).json({ message: "Choose your Flipdish store first" });
        }

        const orders = await getRecentOrders({ storeId: restaurant.flipdishStoreId });
        const newestFirst = orders.sort((a, b) => new Date(b.PlacedTime) - new Date(a.PlacedTime));

        res.status(200).json(newestFirst.slice(0, 3).map(describeOrder));
    } catch (error) {
        res.status(502).json({ message: `Couldn't load orders from Flipdish: ${error.message}` });
    }
};

// GET /api/flipdish/unmatched
// Flipdish items that sold but aren't linked to a ChefStock menu item yet.
const getUnmatched = async (req, res) => {
    try {
        const unmatched = await Sale.aggregate([
            { $match: { restaurant: new mongoose.Types.ObjectId(req.restaurantId), counts: true } },
            { $unwind: "$lines" },
            { $match: { "lines.menuItem": null } },
            {
                $group: {
                    _id: "$lines.flipdishKey",
                    name: { $last: "$lines.name" },
                    timesSold: { $sum: 1 },
                    lastSold: { $max: "$placedAt" },
                },
            },
            { $sort: { timesSold: -1 } },
        ]);

        res.status(200).json(unmatched.map(({ _id, ...rest }) => ({ flipdishKey: _id, ...rest })));
    } catch (error) {
        res.status(500).json({ message: "Failed to load unmatched items", error: error.message });
    }
};

// POST /api/flipdish/match   body: { flipdishKey, menuItemId }
// Links a Flipdish item to a ChefStock menu item, including sales already imported.
const matchItem = async (req, res) => {
    try {
        const { flipdishKey, menuItemId } = req.body;

        // Keys look like "4521" or "4521:9932" (item id : size option id).
        if (typeof flipdishKey !== "string" || !/^\d+(:\d+)?$/.test(flipdishKey)) {
            return res.status(400).json({ message: "Invalid Flipdish item" });
        }
        if (!mongoose.isValidObjectId(menuItemId)) {
            return res.status(404).json({ message: "Menu item not found" });
        }

        const menuItem = await MenuItem.findOne({ _id: menuItemId, restaurant: req.restaurantId, isActive: true });
        if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

        const restaurant = req.restaurantId;
        const previousKey = menuItem.flipdishItemId;

        // One Flipdish item -> one menu item: take the key off anything else that had it.
        await MenuItem.updateMany(
            { restaurant, flipdishItemId: flipdishKey, _id: { $ne: menuItem._id } },
            { flipdishItemId: "" }
        );

        // If this menu item was linked to a different Flipdish item before, unlink those sales.
        if (previousKey && previousKey !== flipdishKey) {
            await Sale.updateMany(
                { restaurant, "lines.flipdishKey": previousKey },
                { $set: { "lines.$[line].menuItem": null } },
                { arrayFilters: [{ "line.flipdishKey": previousKey }] }
            );
        }

        menuItem.flipdishItemId = flipdishKey;
        await menuItem.save();

        // "$[line]" + arrayFilters = "every line in the array whose key matches",
        // not just the first one. One order can have several slices of the same item.
        const result = await Sale.updateMany(
            { restaurant, "lines.flipdishKey": flipdishKey },
            { $set: { "lines.$[line].menuItem": menuItem._id } },
            { arrayFilters: [{ "line.flipdishKey": flipdishKey }] }
        );

        res.status(200).json({ menuItemId: menuItem._id, flipdishKey, salesUpdated: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: "Failed to link item", error: error.message });
    }
};

module.exports = { getStatus, setStore, syncSales, getSampleOrders, getUnmatched, matchItem };
