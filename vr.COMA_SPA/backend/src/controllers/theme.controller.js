const https = require("https");
const Theme = require("../models/theme.model");
const mongoose = require("mongoose");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// --- Logic for Generating a Theme ---
const generateTheme = (req, res) => {
	const { prompt } = req.body;
	if (!prompt)
		return res.status(400).json({ error: "Text prompt is required." });

	const systemPrompt = `You are a creative assistant for a design application that generates color themes. Your task is to respond with a single, clean JSON object and nothing else. The JSON object must contain "themeName", "advice", and a "colors" object. The "colors" object must use these exact keys: "primaryBackground", "canvasBackground", "primaryText", "secondaryText", "accent", "interactiveBackground", "interactiveText", "surfaceBackground", "outlineSeparators".

    Example Response:
    {
    "themeName": "Forest",
    "advice": "This theme evokes a sense of calm and nature, ideal for wellness or environmental brands. The high-contrast text ensures readability on the light surface backgrounds.",
    "colors": {
        "primaryBackground": "#2F4F4F",
        "canvasBackground": "#F0F8FF",
        "primaryText": "#2F4F4F",
        "secondaryText": "#696969",
        "accent": "#556B2F",
        "interactiveBackground": "#556B2F",
        "interactiveText": "#FFFFFF",
        "surfaceBackground": "#FFFFFF",
        "outlineSeparators": "#D3D3D3"
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
};

// --- Logic for CRUD Operations ---
const saveTheme = async (req, res) => {
	try {
		const newTheme = new Theme(req.body);
		await newTheme.save();
		res.status(201).json(newTheme);
	} catch (error) {
		res.status(500).json({ error: "Failed to save theme." });
	}
};

const getAllThemes = async (req, res) => {
	try {
		const themes = await Theme.find();
		res.json(themes);
	} catch (error) {
		res.status(500).json({ error: "Failed to fetch themes." });
	}
};

const deleteTheme = async (req, res) => {
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
};

const updateThemeName = async (req, res) => {
    const { id } = req.params;
    const { themeName } = req.body;

    // Use Mongoose's ObjectId validator
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Invalid ID" });
    }
    if (!themeName || themeName.trim() === '') {
        return res.status(400).json({ error: 'Theme name cannot be empty.' });
    }

    try {
        // Use the Mongoose Model 'Theme' to perform the update
        const result = await Theme.updateOne(
            { _id: id },
            { $set: { themeName: themeName.trim() } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Theme not found or name is unchanged.' });
        }

        res.status(200).json({ message: "Theme name updated successfully." });

    } catch (error) {
        console.error("Error updating theme name:", error);
        res.status(500).json({ error: "Failed to update theme name." });
    }
}

// Export all the functions
module.exports = {
	generateTheme,
	saveTheme,
	getAllThemes,
	deleteTheme,
	updateThemeName,
};
