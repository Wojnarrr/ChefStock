const StockItem = require("../models/StockItem");
const InventoryMovement = require("../models/InventoryMovement");
const DeliveryRecord = require("../models/DeliveryRecord");
const PrepBatch = require("../models/PrepBatch");
const ProductionBatch = require("../models/ProductionBatch");
const StockAdjustment = require("../models/StockAdjustment");

const Recipe = require("../models/Recipe");
const createCostCalculator = require("../utils/createCostCalculator");

const DAY = 24 * 60 * 60 * 1000;
const WEEKS_SHOWN = 8;
const WASTE_REASONS = ["waste", "damaged", "expired"];

// Midnight on the Monday of the week `date` is in.
const startOfWeek = (date) => {
    const monday = new Date(date);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return monday;
};

// What a delivery cost: price x quantity kept, for lines that have a price.
const deliveryTotal = (delivery) =>
    delivery.items.reduce((sum, item) => sum + (item.unitCost ?? 0) * item.quantityAccepted, 0);

// Biggest first, e.g. the top 5 suppliers by spend.
const topEntries = (totalsByName, count = 5) =>
    [...totalsByName]
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, count);

// GET /api/dashboard/costs (owner only)
const getDashboardCosts = async (req, res) => {
    try {
        const restaurant = req.restaurantId;
        const now = new Date();

        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        // The same point in last month, so "so far this month" is a fair comparison.
        const lastMonthSoFar = new Date(Math.min(lastMonth.getTime() + (now - thisMonth), thisMonth));
        const firstWeek = new Date(startOfWeek(now).getTime() - (WEEKS_SHOWN - 1) * 7 * DAY);

        const [deliveries, wasteAdjustments, stockItems, recipes] = await Promise.all([
            DeliveryRecord.find({ restaurant, deliveryDate: { $gte: new Date(Math.min(lastMonth, firstWeek)) } })
                .populate("supplier", "name")
                .lean(),
            StockAdjustment.find({ restaurant, reason: { $in: WASTE_REASONS }, createdAt: { $gte: thisMonth } })
                .populate("stockItem")
                .lean(),
            StockItem.find({ restaurant, isActive: true }).lean(),
            Recipe.find({ restaurant, isActive: true }).populate("ingredients.stockItem").lean(),
        ]);

        // Spend
        let spentThisMonth = 0;
        let spentLastMonthSoFar = 0;
        const spendBySupplier = new Map();
        const weeklySpend = Array.from({ length: WEEKS_SHOWN }, (_, i) => ({
            weekStart: new Date(firstWeek.getTime() + i * 7 * DAY),
            total: 0,
        }));

        for (const delivery of deliveries) {
            const date = new Date(delivery.deliveryDate);
            const total = deliveryTotal(delivery);

            if (date >= thisMonth) {
                spentThisMonth += total;
                const supplier = delivery.supplier?.name ?? "Unknown supplier";
                spendBySupplier.set(supplier, (spendBySupplier.get(supplier) ?? 0) + total);
            } else if (date >= lastMonth && date < lastMonthSoFar) {
                spentLastMonthSoFar += total;
            }

            // round, not floor: a week with a clock change is an hour short of 7 days.
            const week = weeklySpend[Math.round((startOfWeek(date) - firstWeek) / (7 * DAY))];
            if (week) week.total += total;
        }

        // Waste and stock value, using the same prices your recipe costing uses.
        const calculator = createCostCalculator(recipes);
        const costOf = (stockItem) => calculator.getCostPerStockUnit(stockItem).cost;

        let wasteValue = 0;
        const wasteByItem = new Map();

        for (const adjustment of wasteAdjustments) {
            if (!adjustment.stockItem) continue;

            const value = Math.abs(adjustment.quantityChange) * costOf(adjustment.stockItem);
            wasteValue += value;
            wasteByItem.set(adjustment.stockItem.name, (wasteByItem.get(adjustment.stockItem.name) ?? 0) + value);
        }

        const stockValue = stockItems
            .filter((item) => item.currentStock > 0)
            .reduce((sum, item) => sum + item.currentStock * costOf(item), 0);

        res.status(200).json({
            spentThisMonth,
            spentLastMonthSoFar,
            weeklySpend,
            spendBySupplier: topEntries(spendBySupplier),
            wasteValue,
            topWaste: topEntries(wasteByItem),
            stockValue,
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to calculate costs", error: error.message });
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const totalActiveStockItems = await StockItem.countDocuments({
            isActive: true,
            restaurant: req.restaurantId,
        });

        const lowStockItems = await StockItem.find({
            isActive: true,
            restaurant: req.restaurantId,
            $expr: { $lte: ["$currentStock", "$minStockLevel"] },
        })
            .populate("preferredSupplier", "name deliveryDays notes")
            .sort({ currentStock: 1 });

        const negativeStockItems = await StockItem.find({
            isActive: true,
            restaurant: req.restaurantId,
            currentStock: { $lt: 0 },
        }).sort({ currentStock: 1 });

        const recentMovements = await InventoryMovement.find({
            restaurant: req.restaurantId,
        })
            .populate("stockItem", "name stockUnit category")
            .sort({ createdAt: -1 })
            .limit(10);

        const recentDeliveries = await DeliveryRecord.find({
            restaurant: req.restaurantId,
        })
            .populate("supplier", "name")
            .populate("items.stockItem", "name stockUnit")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentPrepBatches = await PrepBatch.find({
            restaurant: req.restaurantId,
        })
            .populate("outputStockItem", "name stockUnit")
            .populate("inputs.stockItem", "name stockUnit")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentProductionBatches = await ProductionBatch.find({
            restaurant: req.restaurantId,
        })
            .populate("itemsProduced.recipe", "name outputUnit")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentStockAdjustments = await StockAdjustment.find({
            restaurant: req.restaurantId,
        })
            .populate("stockItem", "name stockUnit category")
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            counts: {
                totalActiveStockItems,
                lowStockItemsCount: lowStockItems.length,
                negativeStockItemsCount: negativeStockItems.length,
                recentMovementsCount: recentMovements.length,
            },
            lowStockItems,
            negativeStockItems,
            recentMovements,
            recentDeliveries,
            recentPrepBatches,
            recentProductionBatches,
            recentStockAdjustments,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch dashboard summary",
            error: error.message,
        });
    }
};

module.exports = {
    getDashboardSummary,
    getDashboardCosts,
};