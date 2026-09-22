const mongoose = require("mongoose");
require("dotenv").config();

const PrepTask = require("../models/PrepTask");
const PrepBatch = require("../models/PrepBatch");

const RESTAURANT_ID = "6ab271735cac851285f25347";

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const taskResult = await PrepTask.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );
    console.log(`Updated ${taskResult.modifiedCount} prep tasks`);

    const batchResult = await PrepBatch.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );
    console.log(`Updated ${batchResult.modifiedCount} prep batches`);

    await mongoose.disconnect();
};

run();