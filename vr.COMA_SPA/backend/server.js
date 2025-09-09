require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3222;

// --- CONFIGURATION using .env ---
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = "coma_db";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!MONGO_URI || !GEMINI_API_KEY) {
	console.error(
		"FATAL ERROR: Make sure MONGO_URI and GEMINI_API_KEY are set in your .env file."
	);
	process.exit(1);
}

let db;
MongoClient.connect(MONGO_URI, { useUnifiedTopology: true })
	.then((client) => {
		console.log("Connected to MongoDB");
		db = client.db(DB_NAME);
	})
	.catch((error) => console.error("Failed to connect to MongoDB:", error));

// --- MIDDLEWARE ---

//IMPORTANT: cors() must be the first middleware to handle preflight requests correctly
app.use(cors());
app.use(express.json());

// --- API ROUTES ---

app.post("/api/generate-theme", async (req, res) => {
	const { prompt } = req.body;
	if (!prompt) {
		return res.status(400).json({ error: "Text prompt is required." });
	}

	const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

	// The system prompt remains the same.
	const systemPrompt = `You are a creative assistant for a web application that generates color themes. Your task is to respond with a single, clean JSON object and nothing else. The JSON object must contain "themeName", "advice", and "colors" object with all the specified keys. Example:
    {
      "themeName": "Serenity",
      "advice": "This theme creates a calm and peaceful atmosphere, ideal for wellness or minimalist websites. The soft backgrounds ensure readability, while the gentle accent color can be used for subtle highlights and links.",
      "colors": {
        "headerBackground": "#A2B29F", "mainBackground": "#F7F3F1", "primaryText": "#333333", "secondaryText": "#6a6a6a", "accent": "#798777", "buttonBackground": "#A2B29F", "buttonText": "#FFFFFF", "containerBackground": "#FFFFFF", "borderColor": "#E0E0E0"
      }
    }
    REMINDER: Only return the raw JSON object. Do not use markdown like \`\`\`json.`;

	const payload = {
		contents: [{ parts: [{ text: prompt }] }],
		systemInstruction: { parts: [{ text: systemPrompt }] },
		generationConfig: { responseMimeType: "application/json" },
	};

	try {
		const geminiResponse = await fetch(apiUrl, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
		const data = await geminiResponse.json();

		if (!geminiResponse.ok || !data.candidates || !data.candidates[0].content) {
			console.error(
				"Gemini API Error or malformed response:",
				JSON.stringify(data, null, 2)
			);
			throw new Error("Invalid response structure from Gemini API.");
		}

		// --- START OF NEW ROBUST PARSING LOGIC ---

		// 1. Get the raw text from the API response.
		let rawText = data.candidates[0].content.parts[0].text;

		// 2. (FOR DEBUGGING) Log the exact text to your backend terminal.
		// This will show you what Gemini is *actually* sending.
		console.log("--- Raw Gemini API Response Text ---");
		console.log(rawText);
		console.log("------------------------------------");

		// 3. Clean the text: remove markdown backticks and trim whitespace.
		// This looks for ```json ... ``` and extracts the content between them.
		const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
		if (jsonMatch && jsonMatch[1]) {
			rawText = jsonMatch[1];
		}

		// 4. Parse the cleaned text.
		const themeData = JSON.parse(rawText.trim());

		// --- END OF NEW ROBUST PARSING LOGIC ---

		res.json(themeData);
	} catch (error) {
		// This catch block will now also catch JSON.parse errors.
		console.error("Error in /api/generate-theme:", error);
		res.status(500).json({ error: "Failed to generate theme from API." });
	}
});

app.post("/api/themes", async (req, res) => {
	try {
		const themeToSave = req.body;
		const result = await db.collection("saved_themes").insertOne(themeToSave);

		res.status(201).json({ ...themeToSave, _id: result.insertedId });
	} catch (error) {
		console.error("Error saving theme:", error);
		res.status(500).json({ error: "Failed to save theme." });
	}
});

app.get("/api/themes", async (req, res) => {
	try {
		const themes = await db.collection("saved_themes").find().toArray();
		res.json(themes);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch themes." });
	}
});

app.delete("/api/themes/:id", async (req, res) => {
	const { id } = req.params;
	if (!ObjectId.isValid(id))
		return res.status(400).json({ error: "Invalid ID" });
	try {
		const result = await db
			.collection("saved_themes")
			.deleteOne({ _id: new ObjectId(id) });
		if (result.deletedCount === 0)
			return res.status(404).json({ error: "Theme not found" });
		res.status(204).send();
	} catch (error) {
		res.status(500).json({ error: "Failed to delete theme." });
	}
});

app.listen(PORT, () =>
	console.log(`Backend server running on http://localhost:${PORT}`)
);
