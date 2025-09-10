require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");

// --- Initial Setup ---
const app = express();
const PORT = process.env.PORT || 3222;

// --- Connect to Database ---
connectDB();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Use Routes ---
// This tells Express that any request starting with '/api' should be handled by our router
app.use("/api", apiRoutes);

// --- Start Server ---
app.listen(PORT, () =>
	console.log(`Backend server running on http://localhost:${PORT}`)
);
