const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
	try {
		await mongoose.connect(MONGO_URI);
		console.log("Connected to MongoDB via Mongoose");
	} catch (err) {
		console.error("Failed to connect to MongoDB:", err);
		process.exit(1); // Exit process with failure
	}
};

module.exports = connectDB;
