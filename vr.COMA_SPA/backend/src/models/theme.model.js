const mongoose = require("mongoose");

const themeSchema = new mongoose.Schema({
	themeName: String,
	advice: String,
	colors: mongoose.Schema.Types.Mixed,
});

const Theme = mongoose.model("Theme", themeSchema, "saved_themes");

module.exports = Theme;
