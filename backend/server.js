const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const supplierRoutes = require("./routes/suppliers");
const stockItemRoutes = require("./routes/stockItems");
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/suppliers", supplierRoutes);
app.use("/api/stock-items", stockItemRoutes);

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