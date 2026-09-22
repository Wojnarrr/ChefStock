const mongoose = require("mongoose");
require("dotenv").config();

const ProductionBatch = require("../models/ProductionBatch");

const RESTAURANT_ID = "6ab271735cac851285f25347";

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await ProductionBatch.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );
    console.log(`Updated ${result.modifiedCount} production batches`);

    await mongoose.disconnect();
};

run();