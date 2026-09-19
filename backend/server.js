const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const supplierRoutes = require("./routes/suppliers");
const stockItemRoutes = require("./routes/stockItems");
const deliveryRoutes = require("./routes/deliveries");
const inventoryMovementRoutes = require("./routes/inventoryMovements");
const prepBatchRoutes = require("./routes/prepBatches");
const recipeRoutes = require("./routes/recipes");
const productionBatchRoutes = require("./routes/productionBatches");
const stockAdjustmentRoutes = require("./routes/stockAdjustments");
const dashboardRoutes = require("./routes/dashboard");
const prepTaskRoutes = require("./routes/prepTasks");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/suppliers", supplierRoutes);
app.use("/api/stock-items", stockItemRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/inventory-movements", inventoryMovementRoutes);
app.use("/api/prep-batches", prepBatchRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/production-batches", productionBatchRoutes);
app.use("/api/stock-adjustments", stockAdjustmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/prep-tasks", prepTaskRoutes);

app.get("/", (req, res) => {
    res.send("ChefStock API is running");
});


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();