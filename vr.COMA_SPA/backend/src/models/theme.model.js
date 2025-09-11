const mongoose = require("mongoose");

const themeSchema = new mongoose.Schema({
	themeName: {
		type: String,
		required: true,
		unique: true,
		trim: true,
	},
	advice: String,
	colors: mongoose.Schema.Types.Mixed,
});

const Theme = mongoose.model("Theme", themeSchema, "saved_themes");

module.exports = Theme;
