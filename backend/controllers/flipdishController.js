const mongoose = require("mongoose");
const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");
const Sale = require("../models/Sale");
const Recipe = require("../models/Recipe");
const { suggestForItem } = require("../services/menuSuggestions");
const {
    isConfigured,
    getStores,
    getRecentOrders,
    getOrgs,
    getPropertySales,
    getOrgSales,
    getAllPropertySales,
} = require("../services/flipdishClient");
const { describeOrder, describeSale, importSales } = require("../services/flipdishImport");

// Ids that go into a Flipdish URL: letters, numbers, - and _ only.
const SAFE_ID = /^[\w-]{1,64}$/;

const DAY = 24 * 60 * 60 * 1000;
// The till makes a few hundred sales a day, so the first import goes back
// 2 weeks rather than a month (fewer requests to Flipdish).
const FIRST_SYNC_DAYS = 14;
// Re-fetch the last 2 days each time, so orders that changed state
// (accepted -> delivered, or refunded) get updated.
const OVERLAP = 2 * DAY;

// The Sales API needs an org id and a property id. Uses the saved ones, or
// finds them (and saves them) the first time. Returns { orgId, propertyId }
// or { problem } with a message for the owner.
const resolveOrgAndProperty = async (restaurant) => {
    let orgId = restaurant.flipdishOrgId;

    if (!orgId) {
        const orgs = await getOrgs();
        if (orgs.length === 0) return { problem: "Flipdish didn't return any organisation for this login." };
        if (orgs.length > 1) {
            return {
                problem: `This login belongs to ${orgs.length} organisations: ${orgs
                    .map((org) => `${org.name || "unnamed"} (${org.id})`)
                    .join(", ")}. Choose one in the Organisation box, then choose the store again.`,
            };
        }
        orgId = orgs[0].id;
    }

    let propertyId = restaurant.flipdishPropertyId;

    if (!propertyId) {
        // Look at the org's latest sales and see which property they're from.
        const page = await getOrgSales({ orgId, pageSize: 50 });
        const properties = [...new Set((page.data || []).map((entry) => entry.propertyId).filter(Boolean))];

        if (properties.length !== 1) {
            return {
                orgId,
                problem: properties.length
                    ? `Sales came from ${properties.length} properties (${properties.join(", ")}), so I can't tell which is this shop.`
                    : "No recent sales found to work out the property from.",
            };
        }
        propertyId = properties[0];
    }

    if (!SAFE_ID.test(orgId) || !SAFE_ID.test(propertyId)) return { problem: "Flipdish sent an unexpected org or property id." };

    restaurant.flipdishOrgId = orgId;
    restaurant.flipdishPropertyId = propertyId;
    return { orgId, propertyId };
};

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
            orgs: [],
            orgId: restaurant.flipdishOrgId,
            propertyId: restaurant.flipdishPropertyId,
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
                    propertyId: store.PropertyId || null,
                }));

                // Only needed for the newer Sales API (till sales), so a failure here
                // shouldn't hide the stores.
                try {
                    status.orgs = await getOrgs();
                } catch (error) {
                    status.orgsError = error.message;
                }
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

        // Optional: needed for till (POS) sales from the newer Sales API.
        const orgId = req.body.orgId || null;
        const propertyId = req.body.propertyId || null;

        if ((orgId && !SAFE_ID.test(orgId)) || (propertyId && !SAFE_ID.test(propertyId))) {
            return res.status(400).json({ message: "Invalid org or property id" });
        }

        const restaurant = await Restaurant.findById(req.restaurantId);

        // A different store means different orders: start the sync from scratch.
        if (restaurant.flipdishStoreId !== storeId) restaurant.flipdishLastSyncAt = null;
        restaurant.flipdishStoreId = storeId;
        restaurant.flipdishOrgId = orgId;
        restaurant.flipdishPropertyId = propertyId;
        await restaurant.save();

        res.status(200).json({ storeId, orgId, propertyId });
    } catch (error) {
        res.status(400).json({ message: "Failed to save store", error: error.message });
    }
};

// POST /api/flipdish/sync
// Imports sales from every channel (till, website, app...) via the Sales API.
const syncSales = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.restaurantId);
        const { orgId, propertyId, problem } = await resolveOrgAndProperty(restaurant);
        if (problem) return res.status(400).json({ message: problem });

        const to = new Date();
        const isFirstSalesSync = !restaurant.flipdishLastSyncAt || !(await Sale.exists({
            restaurant: restaurant._id,
            source: "flipdish-sales",
        }));
        const from = isFirstSalesSync
            ? new Date(to.getTime() - FIRST_SYNC_DAYS * DAY)
            : new Date(restaurant.flipdishLastSyncAt.getTime() - OVERLAP);

        const entries = await getAllPropertySales({ orgId, propertyId, after: from });
        const { created, updated, byChannel } = await importSales(entries, restaurant._id, propertyId);

        // The Sales API includes online orders too, so the ones imported earlier
        // from the old orders API would now be counted twice. Remove them once.
        const removed = isFirstSalesSync
            ? (await Sale.deleteMany({ restaurant: restaurant._id, source: "flipdish" })).deletedCount
            : 0;

        restaurant.flipdishLastSyncAt = to;
        await restaurant.save();

        res.status(200).json({ fetched: entries.length, created, updated, byChannel, removedOldOrders: removed, from, syncedAt: to });
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

// GET /api/flipdish/sample-sales
// The newest sales from EVERY channel (till, website, app...), without customer
// details, plus how many of the last 50 came from each channel.
const getSampleSales = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.restaurantId);
        const { orgId, propertyId, problem } = await resolveOrgAndProperty(restaurant);
        if (problem) return res.status(400).json({ message: problem });
        await restaurant.save(); // keep the org/property we may have just found

        const page = await getPropertySales({ orgId, propertyId, pageSize: 50 });
        const entries = page.data || [];

        const byChannel = {};
        for (const entry of entries) {
            const channel = entry.salesChannelType || "unknown";
            byChannel[channel] = (byChannel[channel] || 0) + 1;
        }

        res.status(200).json({
            orgId,
            propertyId,
            byChannel,
            byProperty: { [propertyId]: entries.length },
            sales: entries.slice(0, 5).map(describeSale),
        });
    } catch (error) {
        res.status(502).json({ message: `Couldn't load sales from Flipdish: ${error.message}` });
    }
};

// Keys look like "<item id>" or "<item id>:<size option id>"; ids are numbers or uuids.
const VALID_KEY = /^[\w-]{1,64}(:[\w-]{1,64})?$/;

// Flipdish items that sold but aren't linked yet: name, how many sold, the
// latest price. Pass `keys` to look up just those items.
const findUnlinkedItems = async (restaurantId, keys) => {
    const lineFilter = { "lines.menuItem": null };
    if (keys) lineFilter["lines.flipdishKey"] = { $in: keys };

    const items = await Sale.aggregate([
        {
            $match: {
                restaurant: new mongoose.Types.ObjectId(restaurantId),
                source: "flipdish-sales",
                counts: true,
            },
        },
        // Oldest first, so $last below is the most recent name and price.
        { $sort: { placedAt: 1 } },
        { $unwind: "$lines" },
        { $match: lineFilter },
        {
            $group: {
                _id: "$lines.flipdishKey",
                name: { $last: "$lines.name" },
                lastPrice: { $last: "$lines.price" },
                // A line can be "3 x Margherita", so add up quantities, not lines.
                timesSold: { $sum: { $ifNull: ["$lines.quantity", 1] } },
                lastSold: { $max: "$placedAt" },
            },
        },
        { $sort: { timesSold: -1 } },
    ]);

    return items.map(({ _id, ...rest }) => ({ flipdishKey: _id, ...rest }));
};

const getProductionRecipes = (restaurantId) =>
    Recipe.find({ restaurant: restaurantId, isActive: true, recipeType: "production" }).select("name portionsPerOutput");

// Points every imported sale line with this key at the menu item.
// "$[line]" + arrayFilters = "every line in the array whose key matches",
// not just the first one: one order can have several slices of the same item.
const linkSales = async (restaurantId, flipdishKey, menuItemId) => {
    const result = await Sale.updateMany(
        { restaurant: restaurantId, "lines.flipdishKey": flipdishKey },
        { $set: { "lines.$[line].menuItem": menuItemId } },
        { arrayFilters: [{ "line.flipdishKey": flipdishKey }] }
    );
    return result.modifiedCount;
};

// GET /api/flipdish/unmatched
// Unlinked items, each with a suggested recipe and portions if one fits.
const getUnmatched = async (req, res) => {
    try {
        const [items, recipes] = await Promise.all([
            findUnlinkedItems(req.restaurantId),
            getProductionRecipes(req.restaurantId),
        ]);

        res.status(200).json(items.map((item) => ({ ...item, suggestion: suggestForItem(item.name, recipes) })));
    } catch (error) {
        res.status(500).json({ message: "Failed to load unmatched items", error: error.message });
    }
};

// POST /api/flipdish/match   body: { flipdishKey, menuItemId }
// Links a Flipdish item to an EXISTING ChefStock menu item, including sales already imported.
const matchItem = async (req, res) => {
    try {
        const { flipdishKey, menuItemId } = req.body;

        if (typeof flipdishKey !== "string" || !VALID_KEY.test(flipdishKey)) {
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
        if (previousKey && previousKey !== flipdishKey) await linkSales(restaurant, previousKey, null);

        menuItem.flipdishItemId = flipdishKey;
        await menuItem.save();

        const salesUpdated = await linkSales(restaurant, flipdishKey, menuItem._id);
        res.status(200).json({ menuItemId: menuItem._id, flipdishKey, salesUpdated });
    } catch (error) {
        res.status(500).json({ message: "Failed to link item", error: error.message });
    }
};

// POST /api/flipdish/create-menu-items   body: { flipdishKeys: ["...", ...] }
// Creates a ChefStock menu item for each Flipdish item: its name, latest price,
// the suggested recipe and portions, already linked. The owner checks them on
// the Menu page (they're in the "Flipdish import" category).
const createMenuItems = async (req, res) => {
    try {
        const { flipdishKeys } = req.body;

        if (
            !Array.isArray(flipdishKeys) ||
            flipdishKeys.length === 0 ||
            flipdishKeys.length > 100 ||
            !flipdishKeys.every((key) => typeof key === "string" && VALID_KEY.test(key))
        ) {
            return res.status(400).json({ message: "Choose between 1 and 100 Flipdish items" });
        }

        const restaurant = req.restaurantId;
        const [items, recipes, alreadyLinked] = await Promise.all([
            findUnlinkedItems(restaurant, flipdishKeys),
            getProductionRecipes(restaurant),
            MenuItem.find({ restaurant, isActive: true, flipdishItemId: { $in: flipdishKeys } }).select("flipdishItemId"),
        ]);

        // Never make a second menu item for something that's already linked.
        const taken = new Set(alreadyLinked.map((item) => item.flipdishItemId));
        const created = [];

        for (const item of items) {
            if (taken.has(item.flipdishKey)) continue;

            const suggestion = suggestForItem(item.name, recipes);
            const menuItem = await MenuItem.create({
                restaurant,
                name: item.name.slice(0, 100),
                category: "Flipdish import",
                sellPrice: item.lastPrice ?? 0,
                recipe: suggestion?.recipeId ?? null,
                portions: suggestion?.portions ?? 1,
                flipdishItemId: item.flipdishKey,
            });

            await linkSales(restaurant, item.flipdishKey, menuItem._id);
            created.push({ name: menuItem.name, recipeName: suggestion?.recipeName ?? null });
        }

        res.status(201).json({ created: created.length, skipped: flipdishKeys.length - created.length, items: created });
    } catch (error) {
        res.status(400).json({ message: "Failed to create menu items", error: error.message });
    }
};

module.exports = {
    getStatus,
    setStore,
    syncSales,
    getSampleOrders,
    getSampleSales,
    getUnmatched,
    matchItem,
    createMenuItems,
};
