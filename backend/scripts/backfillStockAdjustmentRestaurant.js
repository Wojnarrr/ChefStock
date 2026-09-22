const mongoose = require("mongoose");
require("dotenv").config();

const StockAdjustment = require("../models/StockAdjustment");

const RESTAURANT_ID = "6ab271735cac851285f25347";

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await StockAdjustment.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );
    console.log(`Updated ${result.modifiedCount} stock adjustments`);

    await mongoose.disconnect();
};

run();