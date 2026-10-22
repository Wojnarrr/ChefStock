// Creates a demo pizza shop with about 10 weeks of history, so every page
// (dashboard, stock, deliveries, price charts, menu costing) has something to show.
//
//   node scripts/seedDemo.js
//   node scripts/seedDemo.js --add-owner you@example.com   (also makes YOUR account an owner of it)
//
// Running it again deletes the old demo restaurant first, so you can re-run it any time.
// It only ever deletes the demo restaurant's data, never your own restaurants.
//
// How it works: instead of inventing numbers, it SIMULATES the shop day by day
// (deliveries in the morning, prep, production, waste, a stock count on Sundays)
// and writes the same records your controllers would write, including every
// InventoryMovement with the right previousStock / newStock.

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const RestaurantMembership = require("../models/RestaurantMembership");
const Supplier = require("../models/Supplier");
const StockItem = require("../models/StockItem");
const Recipe = require("../models/Recipe");
const MenuItem = require("../models/MenuItem");
const DeliveryRecord = require("../models/DeliveryRecord");
const PrepBatch = require("../models/PrepBatch");
const PrepTask = require("../models/PrepTask");
const ProductionBatch = require("../models/ProductionBatch");
const StockAdjustment = require("../models/StockAdjustment");
const InventoryMovement = require("../models/InventoryMovement");

const convertRecipeUsageToStockUnit = require("../utils/convertRecipeUsageToStockUnit");
const roundStock = require("../utils/roundStock");

const DEMO_RESTAURANT_NAME = "Tray & Slice Pizzeria (Demo)";
const DEMO_OWNER_EMAIL = "demo.owner@chefstock.test";
const DEMO_STAFF_EMAIL = "demo.staff@chefstock.test";
const DEMO_PASSWORD = "demo1234";
const DAYS_OF_HISTORY = 70;

const newId = () => new mongoose.Types.ObjectId();
const money = (value) => Math.round(value * 100) / 100;

// A random number generator that gives the SAME numbers every run (seeded),
// so the demo looks identical each time you reset it.
const makeRandom = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ---------------------------------------------------------------------------
// 1. The shop itself: suppliers, stock items, recipes, menu
// ---------------------------------------------------------------------------

const SUPPLIERS = {
    liffey: {
        name: "Liffey Wholesale Foods",
        contactPerson: "Ciarán",
        phone: "01 555 0101",
        email: "orders@liffeywholesale.example",
        deliveryDays: ["Monday", "Thursday"],
        notes: "Order by 4pm the day before. Dry goods, meats, sauces.",
        invoicePrefix: "LWF",
    },
    dairy: {
        name: "Glenmore Dairy",
        contactPerson: "Siobhán",
        phone: "01 555 0144",
        email: "sales@glenmoredairy.example",
        deliveryDays: ["Tuesday", "Friday"],
        notes: "Mozzarella price reviewed every quarter.",
        invoicePrefix: "GD",
    },
    produce: {
        name: "Fresh Fields Produce",
        contactPerson: "Tomás",
        phone: "01 555 0177",
        email: "hello@freshfields.example",
        deliveryDays: ["Monday", "Wednesday", "Friday", "Saturday"],
        notes: "Text orders to Tomás before 9pm.",
        invoicePrefix: "FFP",
    },
    packaging: {
        name: "BoxIt Packaging",
        contactPerson: "Laura",
        phone: "01 555 0190",
        email: "orders@boxit.example",
        deliveryDays: ["Wednesday"],
        notes: "Minimum order €50.",
        invoicePrefix: "BOX",
    },
    drinks: {
        name: "Northside Drinks",
        contactPerson: "Darren",
        phone: "01 555 0123",
        email: "darren@northsidedrinks.example",
        deliveryDays: ["Tuesday"],
        notes: "",
        invoicePrefix: "ND",
    },
};

// par = the level you order back up to on a delivery day.
// prices: [dayIndex, price ex VAT] steps over the 10 weeks; `wobble` adds +/- % per delivery.
const STOCK_ITEMS = {
    // Bought in
    flour: { name: "Flour 00 (10 kg sack)", category: "ingredient", stockType: "raw", stockUnit: "case", recipeUnit: "g", unitsPerStockUnit: 10000, min: 2, par: 5, supplier: "liffey", prices: [[0, 14.5], [40, 15.2]], priority: "high" },
    passata: { name: "Tomato passata (6 x 2.5 kg)", category: "ingredient", stockType: "raw", stockUnit: "case", recipeUnit: "g", unitsPerStockUnit: 15000, min: 1, par: 3, supplier: "liffey", prices: [[0, 18.9]] },
    mozzarella: { name: "Mozzarella, grated (4 x 2 kg)", category: "ingredient", stockType: "raw", stockUnit: "case", recipeUnit: "g", unitsPerStockUnit: 8000, min: 2, par: 5, supplier: "dairy", prices: [[0, 62.0], [24, 64.5], [52, 68.0]], priority: "high", expiry: true },
    pepperoni: { name: "Pepperoni, sliced (1 kg)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 1000, min: 3, par: 6, supplier: "liffey", prices: [[0, 12.8], [33, 13.4]], expiry: true },
    ham: { name: "Ham, diced (1 kg)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 1000, min: 2, par: 5, supplier: "liffey", prices: [[0, 9.4]], expiry: true },
    mushrooms: { name: "Mushrooms (2.5 kg box)", category: "ingredient", stockType: "raw", stockUnit: "box", recipeUnit: "g", unitsPerStockUnit: 2500, min: 1.2, par: 2, supplier: "produce", prices: [[0, 8.5]], wobble: 0.06 },
    peppers: { name: "Mixed peppers (2.5 kg box)", category: "ingredient", stockType: "raw", stockUnit: "box", recipeUnit: "g", unitsPerStockUnit: 2500, min: 0.5, par: 1, supplier: "produce", prices: [[0, 7.0]], wobble: 0.1 },
    onions: { name: "Red onions (5 kg box)", category: "ingredient", stockType: "raw", stockUnit: "box", recipeUnit: "g", unitsPerStockUnit: 5000, min: 0.3, par: 1, supplier: "produce", prices: [[0, 5.5]], wobble: 0.05 },
    basil: { name: "Fresh basil (100 g)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 100, min: 1.5, par: 3, supplier: "produce", prices: [[0, 2.5]] },
    oliveOil: { name: "Olive oil (1 l)", category: "ingredient", stockType: "raw", stockUnit: "bottle", recipeUnit: "ml", unitsPerStockUnit: 1000, min: 2, par: 4, supplier: "liffey", prices: [[0, 7.2], [20, 7.6]] },
    yeast: { name: "Dried yeast (500 g)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 500, min: 1, par: 3, supplier: "liffey", prices: [[0, 4.1]] },
    salt: { name: "Salt (1 kg)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 1000, min: 1, par: 3, supplier: "liffey", prices: [[0, 1.2]] },
    sugar: { name: "Sugar (1 kg)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 1000, min: 1, par: 3, supplier: "liffey", prices: [[0, 1.5]] },
    oregano: { name: "Dried oregano (500 g)", category: "ingredient", stockType: "raw", stockUnit: "pack", recipeUnit: "g", unitsPerStockUnit: 500, min: 1, par: 2, supplier: "liffey", prices: [[0, 6.0]] },
    garlic: { name: "Garlic purée (1 kg)", category: "ingredient", stockType: "raw", stockUnit: "container", recipeUnit: "g", unitsPerStockUnit: 1000, min: 1, par: 3, supplier: "liffey", prices: [[0, 5.8]] },
    mayo: { name: "Mayonnaise (5 kg tub)", category: "ingredient", stockType: "raw", stockUnit: "container", recipeUnit: "g", unitsPerStockUnit: 5000, min: 1, par: 2, supplier: "liffey", prices: [[0, 16.0]] },
    // Never had a price entered, so menu items using it show "missing price".
    chilliOil: { name: "Chilli oil (500 ml)", category: "ingredient", stockType: "raw", stockUnit: "bottle", recipeUnit: "ml", unitsPerStockUnit: 500, min: 1, par: 3, supplier: "liffey", prices: [[0, null]] },

    // Packaging and drinks: used by SALES, which the app can't see yet (no Flipdish),
    // so they only go down at the Sunday stock count.
    sliceBox: { name: "Slice boxes (pack of 100)", category: "packaging", stockType: "non_edible", stockUnit: "pack", recipeUnit: "pcs", unitsPerStockUnit: 100, min: 3, par: 8, supplier: "packaging", prices: [[0, 9.0]], counted: 0.5 },
    halfBox: { name: "Half tray boxes (pack of 50)", category: "packaging", stockType: "non_edible", stockUnit: "pack", recipeUnit: "pcs", unitsPerStockUnit: 50, min: 1, par: 2, supplier: "packaging", prices: [[0, 17.0]], counted: 0.12 },
    fullBox: { name: "Full tray boxes (pack of 50)", category: "packaging", stockType: "non_edible", stockUnit: "pack", recipeUnit: "pcs", unitsPerStockUnit: 50, min: 1, par: 2, supplier: "packaging", prices: [[0, 22.0], [45, 23.5]], counted: 0.08 },
    dipPot: { name: "Dip pots with lids (pack of 100)", category: "packaging", stockType: "non_edible", stockUnit: "pack", recipeUnit: "pcs", unitsPerStockUnit: 100, min: 1, par: 3, supplier: "packaging", prices: [[0, 4.0]], counted: 0.15 },
    cola: { name: "Cola 330 ml (case of 24)", category: "drink", stockType: "finished_product", stockUnit: "case", recipeUnit: "can", unitsPerStockUnit: 24, min: 4, par: 12, supplier: "drinks", prices: [[0, 14.4], [45, 15.1]], counted: 1.25 },
    water: { name: "Still water 500 ml (case of 24)", category: "drink", stockType: "finished_product", stockUnit: "case", recipeUnit: "bottle", unitsPerStockUnit: 24, min: 2, par: 6, supplier: "drinks", prices: [[0, 7.2]], counted: 0.5 },

    // Made in house: no supplier and no price; their cost comes from the prep recipe.
    dough: { name: "Pizza dough", category: "ingredient", stockType: "prepared", stockUnit: "kg", recipeUnit: "g", unitsPerStockUnit: 1000, min: 8, par: 20, priority: "high" },
    sauce: { name: "Pizza sauce", category: "ingredient", stockType: "prepared", stockUnit: "kg", recipeUnit: "g", unitsPerStockUnit: 1000, min: 4, par: 10 },
    garlicMayo: { name: "Garlic mayo", category: "ingredient", stockType: "prepared", stockUnit: "kg", recipeUnit: "g", unitsPerStockUnit: 1000, min: 1, par: 2, counted: 0.28 },
};

// Quantities are in each stock item's recipe unit (g / ml).
const PREP_RECIPES = {
    dough: {
        name: "Pizza dough (10 kg batch)",
        output: "dough",
        outputQuantity: 10,
        ingredients: [["flour", 6000], ["yeast", 30], ["salt", 120], ["sugar", 60], ["oliveOil", 150]],
        notes: "Add 3.6 l cold water. Mix 8 min, rest 24 h in the walk-in.",
        makeWhenBelow: 16,
        batchSize: 20,
    },
    sauce: {
        name: "Pizza sauce (5 kg batch)",
        output: "sauce",
        outputQuantity: 5,
        ingredients: [["passata", 4500], ["oliveOil", 100], ["oregano", 25], ["salt", 30], ["sugar", 20], ["garlic", 50]],
        notes: "Don't cook it. Blitz and chill.",
        makeWhenBelow: 7,
        batchSize: 10,
    },
    garlicMayo: {
        name: "Garlic mayo (2 kg batch)",
        output: "garlicMayo",
        outputQuantity: 2,
        ingredients: [["mayo", 1800], ["garlic", 200]],
        notes: "Use within 4 days.",
        makeWhenBelow: 0.8,
        batchSize: 2,
    },
};

// One tray = 8 slices. traysPerDay is the average; Fri/Sat are busier.
const PRODUCTION_RECIPES = {
    margherita: {
        name: "Margherita tray",
        ingredients: [["dough", 650], ["sauce", 300], ["mozzarella", 400], ["oliveOil", 10], ["oregano", 2], ["basil", 10, true]],
        traysPerDay: 4,
    },
    pepperoni: {
        name: "Pepperoni tray",
        ingredients: [["dough", 650], ["sauce", 300], ["mozzarella", 380], ["pepperoni", 160]],
        traysPerDay: 4.5,
    },
    hamMushroom: {
        name: "Ham & mushroom tray",
        ingredients: [["dough", 650], ["sauce", 300], ["mozzarella", 380], ["ham", 180], ["mushrooms", 200]],
        traysPerDay: 3,
    },
    veggie: {
        name: "Veggie tray",
        ingredients: [["dough", 650], ["sauce", 300], ["mozzarella", 350], ["peppers", 150], ["onions", 100], ["mushrooms", 120]],
        traysPerDay: 2,
    },
};

// sellPrice includes VAT. vatRate null = the restaurant's 13.5%; drinks are 23%.
const MENU_ITEMS = [
    ["Margherita slice", "Slices", "margherita", 1, 3.5, [["sliceBox", 1]]],
    ["Pepperoni slice", "Slices", "pepperoni", 1, 3.8, [["sliceBox", 1]]],
    ["Ham & mushroom slice", "Slices", "hamMushroom", 1, 3.8, [["sliceBox", 1]]],
    ["Veggie slice", "Slices", "veggie", 1, 3.7, [["sliceBox", 1]]],
    ["Margherita half tray", "Half trays", "margherita", 4, 13.0, [["halfBox", 1]]],
    ["Pepperoni half tray", "Half trays", "pepperoni", 4, 14.0, [["halfBox", 1]]],
    ["Ham & mushroom half tray", "Half trays", "hamMushroom", 4, 14.0, [["halfBox", 1]]],
    ["Veggie half tray", "Half trays", "veggie", 4, 13.5, [["halfBox", 1]]],
    ["Margherita full tray", "Full trays", "margherita", 8, 24.0, [["fullBox", 1]]],
    ["Pepperoni full tray", "Full trays", "pepperoni", 8, 26.0, [["fullBox", 1]]],
    ["Ham & mushroom full tray", "Full trays", "hamMushroom", 8, 26.0, [["fullBox", 1]]],
    ["Veggie full tray", "Full trays", "veggie", 8, 25.0, [["fullBox", 1]]],
    // Cheap deal: lands over the 30% target, so it gets flagged on the menu page.
    ["Lunch deal: slice + can", "Deals", "margherita", 1, 4.5, [["sliceBox", 1], ["cola", 1]]],
    ["Garlic dip", "Dips", null, 1, 1.0, [["garlicMayo", 50], ["dipPot", 1]]],
    // Chilli oil has no price yet, so this one shows as incomplete.
    ["Chilli oil dip", "Dips", null, 1, 1.0, [["chilliOil", 30], ["dipPot", 1]]],
    ["Cola 330 ml", "Drinks", null, 1, 2.2, [["cola", 1]], 23],
    ["Still water 500 ml", "Drinks", null, 1, 1.8, [["water", 1]], 23],
];

// Waste that happens now and then (checked each evening).
const WASTE_EVENTS = [
    { item: "dough", amount: [1.5, 3], reason: "waste", notes: "Dough over-proved" },
    { item: "mushrooms", amount: [0.15, 0.3], reason: "expired", notes: "Gone slimy" },
    { item: "basil", amount: [0.5, 1], reason: "expired", notes: "Wilted" },
    { item: "mozzarella", amount: [0.05, 0.1], reason: "damaged", notes: "Bag split" },
    { item: "sauce", amount: [0.5, 1.5], reason: "waste", notes: "Past use-by" },
];

// ---------------------------------------------------------------------------
// 2. The simulation
// ---------------------------------------------------------------------------

function buildDemoData({ ownerId, staffId, now = new Date(), seed = 2026 }) {
    const random = makeRandom(seed);
    const between = (low, high) => low + random() * (high - low);

    const restaurantId = newId();
    const firstDay = new Date(now);
    firstDay.setHours(0, 0, 0, 0);
    firstDay.setDate(firstDay.getDate() - (DAYS_OF_HISTORY - 1));
    const setupDate = new Date(firstDay.getTime() - 2 * 24 * 60 * 60 * 1000);

    const at = (day, hours, minutes = 0) => {
        const date = new Date(day);
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    // --- Static data ---
    const restaurant = {
        _id: restaurantId,
        name: DEMO_RESTAURANT_NAME,
        address: "12 Example Street, Dublin 8",
        vatRate: 13.5,
        targetFoodCostPercent: 30,
        createdAt: setupDate,
    };

    const suppliers = {};
    for (const [key, supplier] of Object.entries(SUPPLIERS)) {
        const { invoicePrefix, ...fields } = supplier;
        suppliers[key] = { _id: newId(), restaurant: restaurantId, ...fields, createdAt: setupDate };
    }

    const stockItems = {};
    for (const [key, item] of Object.entries(STOCK_ITEMS)) {
        stockItems[key] = {
            _id: newId(),
            restaurant: restaurantId,
            name: item.name,
            category: item.category,
            stockType: item.stockType,
            stockUnit: item.stockUnit,
            recipeUnit: item.recipeUnit,
            packType: item.stockUnit === item.recipeUnit ? "none" : "fixed",
            unitsPerStockUnit: item.unitsPerStockUnit,
            currentStock: item.par, // opening stock, set when the item was created
            minStockLevel: item.min,
            reorderQuantity: roundStock(item.par - item.min),
            preferredSupplier: item.supplier ? suppliers[item.supplier]._id : null,
            requiresExpiryTracking: Boolean(item.expiry),
            trackingPriority: item.priority || "medium",
            lastUnitCost: null,
            lastCostDate: null,
            createdAt: setupDate,
        };
    }

    const ingredientList = (ingredients) =>
        ingredients.map(([key, quantity, isOptional]) => ({
            stockItem: stockItems[key]._id,
            quantity,
            unit: stockItems[key].recipeUnit,
            isOptional: Boolean(isOptional),
        }));

    const recipes = {};
    for (const [key, recipe] of Object.entries(PREP_RECIPES)) {
        recipes[key] = {
            _id: newId(),
            restaurant: restaurantId,
            name: recipe.name,
            recipeType: "prep",
            outputStockItem: stockItems[recipe.output]._id,
            outputQuantity: recipe.outputQuantity,
            outputUnit: stockItems[recipe.output].stockUnit,
            ingredients: ingredientList(recipe.ingredients),
            notes: recipe.notes,
            createdAt: setupDate,
        };
    }
    for (const [key, recipe] of Object.entries(PRODUCTION_RECIPES)) {
        recipes[key] = {
            _id: newId(),
            restaurant: restaurantId,
            name: recipe.name,
            recipeType: "production",
            outputQuantity: 1,
            outputUnit: "tray",
            portionsPerOutput: 8,
            ingredients: ingredientList(recipe.ingredients),
            createdAt: setupDate,
        };
    }

    const menuItems = MENU_ITEMS.map(([name, category, recipeKey, portions, sellPrice, extras, vatRate]) => ({
        _id: newId(),
        restaurant: restaurantId,
        name,
        category,
        recipe: recipeKey ? recipes[recipeKey]._id : null,
        portions,
        extras: extras.map(([key, quantity]) => ({ stockItem: stockItems[key]._id, quantity })),
        sellPrice,
        vatRate: vatRate ?? null,
        createdAt: setupDate,
    }));

    // --- History ---
    const deliveries = [];
    const prepBatches = [];
    const prepTasks = [];
    const productionBatches = [];
    const stockAdjustments = [];
    const inventoryMovements = [];

    const stock = Object.fromEntries(Object.entries(stockItems).map(([key, item]) => [key, item.currentStock]));
    const soldSinceCount = Object.fromEntries(Object.keys(stockItems).map((key) => [key, 0]));
    const invoiceCounters = Object.fromEntries(Object.keys(SUPPLIERS).map((key) => [key, 1040]));
    let lowest = Object.fromEntries(Object.keys(stock).map((key) => [key, stock[key]]));

    // Every stock change goes through here, exactly like the controllers do it.
    const moveStock = (key, change, date, movementType, sourceType, sourceId, performedBy, notes) => {
        const previousStock = stock[key];
        const newStock = roundStock(previousStock + change);
        stock[key] = newStock;
        lowest[key] = Math.min(lowest[key], newStock);

        inventoryMovements.push({
            restaurant: restaurantId,
            stockItem: stockItems[key]._id,
            movementType,
            quantityChange: roundStock(change),
            unit: stockItems[key].stockUnit,
            previousStock,
            newStock,
            sourceType,
            sourceId,
            performedBy,
            notes,
            createdAt: date,
        });
    };

    const priceOn = (key, dayIndex) => {
        const { prices, wobble } = STOCK_ITEMS[key];
        let price = prices[0][1];
        for (const [fromDay, value] of prices) if (dayIndex >= fromDay) price = value;
        if (price == null) return null;
        return money(wobble ? price * (1 + between(-wobble, wobble)) : price);
    };

    const deductRecipe = (recipeKey, scale, date, sourceType, sourceId, performedBy, notesFor) => {
        const recipe = recipes[recipeKey];
        const inputs = [];

        for (const ingredient of recipe.ingredients) {
            const key = Object.keys(stockItems).find((k) => stockItems[k]._id.equals(ingredient.stockItem));
            const used = ingredient.quantity * scale;
            const stockUnits = roundStock(convertRecipeUsageToStockUnit(stockItems[key], used));

            moveStock(key, -stockUnits, date, sourceType === "PrepBatch" ? "prep_input" : "production_usage",
                sourceType, sourceId, performedBy, notesFor(used, ingredient.unit));
            inputs.push({ stockItem: stockItems[key]._id, quantityUsed: stockUnits, unit: stockItems[key].stockUnit });
        }
        return inputs;
    };

    // Each item's MOST RECENT delivery is skipped on purpose ("supplier was out"),
    // so the demo always ends with a few low-stock warnings.
    const SHORT_ON_LAST_DELIVERY = ["mushrooms", "basil", "cola"];
    const skipped = {};
    for (const key of SHORT_ON_LAST_DELIVERY) {
        const { deliveryDays } = SUPPLIERS[STOCK_ITEMS[key].supplier];
        for (let dayIndex = DAYS_OF_HISTORY - 1; dayIndex >= 0; dayIndex--) {
            const day = new Date(firstDay);
            day.setDate(firstDay.getDate() + dayIndex);
            if (deliveryDays.includes(WEEKDAYS[day.getDay()]) && at(day, 9) <= now) {
                (skipped[dayIndex] ??= []).push(key);
                break;
            }
        }
    }

    for (let dayIndex = 0; dayIndex < DAYS_OF_HISTORY; dayIndex++) {
        const day = new Date(firstDay);
        day.setDate(firstDay.getDate() + dayIndex);
        const weekday = WEEKDAYS[day.getDay()];
        const happened = (date) => date <= now;

        // 07:00 Deliveries: on its delivery day, each supplier brings items back up to par.
        Object.entries(SUPPLIERS).forEach(([supplierKey, supplier], index) => {
            if (!supplier.deliveryDays.includes(weekday)) return;
            const deliveryDate = at(day, 7, index * 20);
            if (!happened(deliveryDate)) return;

            const lines = [];
            for (const [key, item] of Object.entries(STOCK_ITEMS)) {
                if (item.supplier !== supplierKey || (skipped[dayIndex] || []).includes(key)) continue;
                // Chilli oil only ever came once, and nobody typed the price in.
                if (key === "chilliOil" && dayIndex !== 30) continue;

                const needed = key === "chilliOil" ? 2 : Math.ceil(item.par - stock[key] - 0.001);
                if (needed <= 0 || stock[key] > item.par - item.min * 0.5) continue;

                const line = {
                    stockItem: stockItems[key]._id,
                    quantityExpected: needed,
                    quantityReceived: needed,
                    quantityAccepted: needed,
                    unit: item.stockUnit,
                    unitCost: priceOn(key, dayIndex),
                    issueType: "none",
                    issueNotes: "",
                };
                if (needed >= 2 && random() < 0.05) {
                    line.quantityAccepted = needed - 1;
                    line.issueType = "damaged";
                    line.issueNotes = "One crushed in transit, sent back with the driver";
                }
                lines.push([key, line]);
            }
            if (lines.length === 0) return;

            const delivery = {
                _id: newId(),
                restaurant: restaurantId,
                supplier: suppliers[supplierKey]._id,
                deliveryDate,
                receivedBy: random() < 0.6 ? staffId : ownerId,
                items: lines.map(([, line]) => line),
                invoiceNumber: `${supplier.invoicePrefix}-${invoiceCounters[supplierKey]++}`,
                notes: (skipped[dayIndex] || []).some((key) => STOCK_ITEMS[key].supplier === supplierKey)
                    ? "Some items out of stock at the supplier, coming next delivery"
                    : "",
                createdAt: deliveryDate,
            };
            deliveries.push(delivery);

            for (const [key, line] of lines) {
                moveStock(key, line.quantityAccepted, deliveryDate, "delivery", "DeliveryRecord", delivery._id,
                    delivery.receivedBy, "Delivery received from supplier");
                if (line.unitCost != null) {
                    stockItems[key].lastUnitCost = line.unitCost;
                    stockItems[key].lastCostDate = deliveryDate;
                }
            }
        });

        // 08:00 Prep: make dough / sauce / garlic mayo when running low, as completed prep tasks.
        Object.entries(PREP_RECIPES).forEach(([recipeKey, prep], index) => {
            const prepDate = at(day, 8, index * 25);
            if (!happened(prepDate) || stock[prep.output] >= prep.makeWhenBelow) return;

            const recipe = recipes[recipeKey];
            const prepBatchId = newId();
            const taskName = `Make ${stockItems[prep.output].name.toLowerCase()}`;
            const inputs = deductRecipe(recipeKey, prep.batchSize / recipe.outputQuantity, prepDate, "PrepBatch",
                prepBatchId, staffId, () => `Used for prep task: ${taskName}`);

            moveStock(prep.output, prep.batchSize, prepDate, "prep_output", "PrepBatch", prepBatchId, staffId,
                `Prep task completed: ${taskName}`);

            prepBatches.push({
                _id: prepBatchId,
                restaurant: restaurantId,
                prepDate,
                preparedBy: staffId,
                prepType: "recipe_based",
                outputStockItem: stockItems[prep.output]._id,
                outputQuantity: prep.batchSize,
                outputUnit: recipe.outputUnit,
                inputs,
                notes: `Auto-generated from prep task: ${taskName}`,
                createdAt: prepDate,
            });
            prepTasks.push({
                restaurant: restaurantId,
                prepDate: at(day, 7),
                taskName,
                linkedRecipe: recipe._id,
                targetQuantity: prep.batchSize,
                assignedTo: "Aoife",
                status: "done",
                dueTime: "09:00",
                completedAt: prepDate,
                linkedPrepBatch: prepBatchId,
                createdAt: at(day, 7),
            });
        });

        // 10:30 Production: the day's trays. Fridays and Saturdays are busier.
        const productionDate = at(day, 10, 30);
        if (happened(productionDate)) {
            const dayFactor = { Friday: 1.35, Saturday: 1.5, Sunday: 1.1, Monday: 0.8 }[weekday] || 1;
            const batchId = newId();
            const itemsProduced = [];

            for (const [recipeKey, recipe] of Object.entries(PRODUCTION_RECIPES)) {
                const trays = Math.max(1, Math.round(recipe.traysPerDay * dayFactor * between(0.8, 1.2)));
                itemsProduced.push({ recipe: recipes[recipeKey]._id, quantityProduced: trays, outputUnit: "tray" });
                deductRecipe(recipeKey, trays, productionDate, "ProductionBatch", batchId, staffId,
                    (used, unit) => `Estimated usage for ${recipe.name}: ${used}${unit}`);
            }

            productionBatches.push({
                _id: batchId,
                restaurant: restaurantId,
                productionDate,
                producedBy: staffId,
                itemsProduced,
                notes: weekday === "Saturday" ? "Match day, extra pepperoni" : "",
                createdAt: productionDate,
            });
        }

        // What customers used today (boxes, drinks, dips). The app only finds out at the count.
        for (const [key, item] of Object.entries(STOCK_ITEMS)) {
            if (item.counted) soldSinceCount[key] += item.counted * between(0.75, 1.25) * (weekday === "Saturday" ? 1.4 : 1);
        }

        const addAdjustment = (key, newStock, reason, notes, date, adjustedBy) => {
            const adjustmentId = newId();
            const previousStock = stock[key];
            const roundedNewStock = roundStock(Math.max(0, newStock));
            stockAdjustments.push({
                _id: adjustmentId,
                restaurant: restaurantId,
                stockItem: stockItems[key]._id,
                previousStock,
                newStock: roundedNewStock,
                quantityChange: roundStock(roundedNewStock - previousStock),
                unit: stockItems[key].stockUnit,
                reason,
                adjustedBy,
                notes,
                createdAt: date,
            });
            moveStock(key, roundedNewStock - previousStock, date, "manual_adjustment", "StockAdjustment", adjustmentId,
                adjustedBy, `Stock adjustment: ${reason}${notes ? ` - ${notes}` : ""}`);
        };

        // 21:30 Waste, roughly every 4 days, plus staff food on Fridays.
        const wasteDate = at(day, 21, 30);
        if (happened(wasteDate) && random() < 0.27) {
            const event = WASTE_EVENTS[Math.floor(random() * WASTE_EVENTS.length)];
            const amount = roundStock(between(...event.amount));
            if (stock[event.item] > amount) {
                addAdjustment(event.item, stock[event.item] - amount, event.reason, event.notes, wasteDate, staffId);
            }
        }
        if (happened(wasteDate) && weekday === "Friday") {
            addAdjustment("dough", stock.dough - 1.3, "staff_food", "Two staff pizzas", at(day, 21, 45), ownerId);
        }

        // 22:00 Sunday stock count: boxes, drinks and dips get corrected to what's actually there.
        const countDate = at(day, 22);
        if (happened(countDate) && weekday === "Sunday") {
            Object.keys(STOCK_ITEMS).forEach((key, index) => {
                if (!STOCK_ITEMS[key].counted) return;
                addAdjustment(key, stock[key] - soldSinceCount[key], "stock_count_correction", "Weekly count",
                    at(day, 22, index), ownerId);
                soldSinceCount[key] = 0;
            });
        }
    }

    // A few things still to do today.
    const today = at(now, 7);
    prepTasks.push(
        { restaurant: restaurantId, prepDate: today, taskName: "Make garlic mayo", linkedRecipe: recipes.garlicMayo._id, targetQuantity: 2, assignedTo: "Aoife", status: "pending", dueTime: "16:00", notes: "", createdAt: today },
        { restaurant: restaurantId, prepDate: today, taskName: "Deep clean the dough mixer", assignedTo: "Jakub", status: "pending", dueTime: "15:00", notes: "", createdAt: today },
        { restaurant: restaurantId, prepDate: today, taskName: "Call Glenmore about the mozzarella price", assignedTo: "", status: "in_progress", dueTime: "", notes: "Up about 10% since August", createdAt: today },
    );

    // Opening stock + every movement = the stock the app shows today.
    for (const key of Object.keys(stockItems)) stockItems[key].currentStock = stock[key];

    return {
        restaurant,
        suppliers: Object.values(suppliers),
        stockItems: Object.values(stockItems),
        recipes: Object.values(recipes),
        menuItems,
        deliveries,
        prepBatches,
        prepTasks,
        productionBatches,
        stockAdjustments,
        inventoryMovements,
        lowestStock: lowest,
        stockByKey: stockItems,
    };
}

// ---------------------------------------------------------------------------
// 3. Writing it to the database
// ---------------------------------------------------------------------------

const RESTAURANT_SCOPED_MODELS = [
    Supplier, StockItem, Recipe, MenuItem, DeliveryRecord, PrepBatch, PrepTask,
    ProductionBatch, StockAdjustment, InventoryMovement, RestaurantMembership,
];

// Finds the old demo restaurant (by its name, or by the demo owner's account)
// and deletes it and everything in it.
const removeOldDemo = async () => {
    const demoUsers = await User.find({ email: { $in: [DEMO_OWNER_EMAIL, DEMO_STAFF_EMAIL] } });
    const memberships = await RestaurantMembership.find({ user: { $in: demoUsers.map((u) => u._id) }, role: "owner" });
    const byName = await Restaurant.find({ name: DEMO_RESTAURANT_NAME });

    const restaurantIds = [...memberships.map((m) => m.restaurant), ...byName.map((r) => r._id)];

    for (const Model of RESTAURANT_SCOPED_MODELS) {
        await Model.deleteMany({ restaurant: { $in: restaurantIds } });
    }
    await Restaurant.deleteMany({ _id: { $in: restaurantIds } });
    await User.deleteMany({ _id: { $in: demoUsers.map((u) => u._id) } });

    if (restaurantIds.length > 0) console.log("Removed the old demo restaurant.");
};

const readArg = (name) => {
    const index = process.argv.indexOf(name);
    return index === -1 ? null : process.argv[index + 1];
};

const main = async () => {
    const addOwnerEmail = readArg("--add-owner");

    await mongoose.connect(process.env.MONGO_URI);
    console.log(`Connected to ${mongoose.connection.host}`);

    await removeOldDemo();

    const ownerId = newId();
    const staffId = newId();
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const data = buildDemoData({ ownerId, staffId });
    const restaurantId = data.restaurant._id;

    await User.insertMany([
        { _id: ownerId, name: "Demo Owner", email: DEMO_OWNER_EMAIL, passwordHash },
        { _id: staffId, name: "Aoife (demo staff)", email: DEMO_STAFF_EMAIL, passwordHash },
    ]);
    await Restaurant.create(data.restaurant);

    const memberships = [
        { user: ownerId, restaurant: restaurantId, role: "owner" },
        { user: staffId, restaurant: restaurantId, role: "staff" },
    ];
    if (addOwnerEmail) {
        const you = await User.findOne({ email: addOwnerEmail.toLowerCase() });
        if (you) memberships.push({ user: you._id, restaurant: restaurantId, role: "owner" });
        else console.warn(`No account found for ${addOwnerEmail}, so it wasn't added.`);
    }
    await RestaurantMembership.insertMany(memberships);

    // insertMany still runs your schema validation (required fields, enums, min,
    // and the pre("validate") checks), so bad demo data fails here, not in the UI.
    await Supplier.insertMany(data.suppliers);
    await StockItem.insertMany(data.stockItems);
    await Recipe.insertMany(data.recipes);
    await MenuItem.insertMany(data.menuItems);
    await DeliveryRecord.insertMany(data.deliveries);
    await PrepBatch.insertMany(data.prepBatches);
    await PrepTask.insertMany(data.prepTasks);
    await ProductionBatch.insertMany(data.productionBatches);
    await StockAdjustment.insertMany(data.stockAdjustments);
    await InventoryMovement.insertMany(data.inventoryMovements);

    console.log(`
Created "${DEMO_RESTAURANT_NAME}":
  ${data.stockItems.length} stock items, ${data.recipes.length} recipes, ${data.menuItems.length} menu items
  ${data.deliveries.length} deliveries, ${data.productionBatches.length} production days, ${data.prepBatches.length} prep batches
  ${data.stockAdjustments.length} stock adjustments, ${data.inventoryMovements.length} inventory movements

Log in as:
  owner  ${DEMO_OWNER_EMAIL} / ${DEMO_PASSWORD}
  staff  ${DEMO_STAFF_EMAIL} / ${DEMO_PASSWORD}`);

    await mongoose.disconnect();
};

if (require.main === module) {
    main().catch(async (error) => {
        console.error("Seeding failed:", error.message);
        await mongoose.disconnect();
        process.exit(1);
    });
}

module.exports = { buildDemoData };
