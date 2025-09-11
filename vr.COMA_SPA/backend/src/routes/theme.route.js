const express = require("express");
const router = express.Router();
const themeController = require("../controllers/theme.controller"); // Import the controller

// Map routes to controller functions
router.post("/generate-theme", themeController.generateTheme);
router.post("/themes", themeController.saveTheme);
router.get("/themes", themeController.getAllThemes);
router.delete("/themes/:id", themeController.deleteTheme);
router.patch("/themes/:id", themeController.updateThemeName);

module.exports = router;
