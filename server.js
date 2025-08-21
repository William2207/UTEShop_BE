const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");

dotenv.config();
connectDB();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes
app.get("/", (req, res) => res.send("UTEShop API running..."));
app.use("/api/users", require("./src/routes/userRoutes"));

// start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
