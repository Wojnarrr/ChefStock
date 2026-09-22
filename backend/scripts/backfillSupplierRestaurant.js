const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Supplier = require("../models/Supplier");

dotenv.config();

const RESTAURANT_ID = "6ab271735cac851285f25347";

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);

    const result = await Supplier.updateMany(
        { restaurant: { $exists: false } },
        { $set: { restaurant: RESTAURANT_ID } }
    );

    console.log(`Updated ${result.modifiedCount} supplier(s).`);

    await mongoose.disconnect();
};

run();