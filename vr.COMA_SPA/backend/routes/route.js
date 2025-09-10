const express = require("express");
const router = express.Router();
const https = require("https");
const mongoose = require("mongoose");

// --- Mongoose Schema and Model ---
const themeSchema = new mongoose.Schema({
	themeName: String,
	advice: String,
	colors: mongoose.Schema.Types.Mixed, // Allows for a flexible object structure
});

const Theme = mongoose.model("Theme", themeSchema, "saved_themes"); // 3rd arg specifies the collection name

// --- API ROUTES ---
router.post("/generate-theme", (req, res) => {
	const { prompt } = req.body;
	if (!prompt)
		return res.status(400).json({ error: "Text prompt is required." });

	const systemPrompt = `You are a creative assistant for a web application that generates color themes. Your task is to respond with a single, clean JSON object and nothing else. The JSON object must contain "themeName", "advice", and "colors" object with all the specified keys. Example:
    {
      "themeName": "Serenity",
      "advice": "This theme creates a calm and peaceful atmosphere, ideal for wellness or minimalist websites. The soft backgrounds ensure readability, while the gentle accent color can be used for subtle highlights and links.",
      "colors": {
        "headerBackground": "#A2B29F", "mainBackground": "#F7F3F1", "primaryText": "#333333", "secondaryText": "#6a6a6a", "accent": "#798777", "buttonBackground": "#A2B29F", "buttonText": "#FFFFFF", "containerBackground": "#FFFFFF", "borderColor": "#E0E0E0"
      }
    }
    REMINDER: Only return the raw JSON object. Do not use markdown like \`\`\`json.`;

	const payload = JSON.stringify({
		contents: [{ parts: [{ text: prompt }] }],
		systemInstruction: { parts: [{ text: systemPrompt }] },
		generationConfig: { responseMimeType: "application/json" },
	});

	const options = {
		hostname: "generativelanguage.googleapis.com",
		path: `/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": Buffer.byteLength(payload),
		},
	};

	const apiRequest = https.request(options, (apiRes) => {
		let data = "";
		apiRes.on("data", (chunk) => {
			data += chunk;
		});
		apiRes.on("end", () => {
			try {
				if (apiRes.statusCode !== 200) {
					console.error("Gemini API Error:", data);
					throw new Error("API returned non-200 status");
				}
				const responseJson = JSON.parse(data);
				const rawText = responseJson.candidates[0].content.parts[0].text;
				const themeData = JSON.parse(rawText);
				res.json(themeData);
			} catch (error) {
				console.error("Error parsing Gemini response:", error);
				res.status(500).json({ error: "Failed to parse theme from API." });
			}
		});
	});

	apiRequest.on("error", (error) => {
		console.error("Error calling Gemini API:", error);
		res.status(500).json({ error: "Failed to generate theme from API." });
	});

	apiRequest.write(payload);
	apiRequest.end();
});

router.post("/themes", async (req, res) => {
	try {
		const newTheme = new Theme(req.body);
		await newTheme.save();
		res.status(201).json(newTheme);
	} catch (error) {
		res.status(500).json({ error: "Failed to save theme." });
	}
});

router.get("/themes", async (req, res) => {
	try {
		const themes = await Theme.find();
		res.json(themes);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch themes." });
	}
});

router.delete("/themes/:id", async (req, res) => {
	const { id } = req.params;
	if (!mongoose.Types.ObjectId.isValid(id))
		return res.status(400).json({ error: "Invalid ID" });
	try {
		const result = await Theme.findByIdAndDelete(id);
		if (!result) return res.status(404).json({ error: "Theme not found" });
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: "Failed to delete theme." });
	}
});

module.exports = router;
