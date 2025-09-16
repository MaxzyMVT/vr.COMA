require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");
const themeRoutes = require("./routes/theme.route.js");

const app = express();
const PORT = 3222;

connectDB();

app.use(cors());
app.use(express.json());

// Main router for the application
app.use("/api", themeRoutes);

app.listen(PORT, () =>
	console.log(`Backend server running on http://localhost:${PORT}`)
);
