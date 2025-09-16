const mongoose = require("mongoose");

const ThemeSchema = new mongoose.Schema({
  themeName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  advice: {
    type: String,
    required: true
  },
  isDark: {
    type: Boolean,
    required: true,
    default: false
  },
  colors: mongoose.Schema.Types.Mixed,
});

// Optional but recommended: pre-validation hook for data consistency
ThemeSchema.pre("validate", function(next) {
  if (typeof this.isDark !== "boolean") {
    this.isDark = false;
  }
  if (this.themeName) {
    // This cleans up theme name suffixes like "Theme Name   (Night) " to "Theme Name (Night)"
    this.themeName = this.themeName.replace(/\s+\((Day|Dark|Night)\)\s*$/i, (m, g) => ` (${g})`).trim();
  }
  next();
});

const Theme = mongoose.model("Theme", ThemeSchema, "saved_themes");

module.exports = Theme;