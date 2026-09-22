const mongoose = require("mongoose");
require("dotenv").config();

const DeliveryRecord = require("../models/DeliveryRecord");
const InventoryMovement = require("../models/InventoryMovement");

const RESTAURANT_ID = "6ab271735cac851285f25347";

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const deliveryResult = await DeliveryRecord.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );
    console.log(`Updated ${deliveryResult.modifiedCount} delivery records`);

    const movementResult = await InventoryMovement.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );
    console.log(`Updated ${movementResult.modifiedCount} inventory movements`);

    await mongoose.disconnect();
};

run();