const https = require("https");
const Theme = require("../models/theme.model");
const mongoose = require("mongoose");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper function to escape special characters for use in a regular expression
function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// --- Logic for Generating a Theme ---
const generateTheme = (req, res) => {
	const { prompt } = req.body;
	if (!prompt)
		return res.status(400).json({ error: "Text prompt is required." });

	const systemPrompt = `You are a creative assistant for a design application that generates color themes. Respond with a single, clean JSON object.

	REQUIREMENTS:
	- The root object must contain keys: "themeName", "advice", and "colors".
	- The "colors" object must contain EXACTLY these 14 keys, in this order:
	"primaryHeader", "secondaryHeader", "headerText", "subHeaderText", "canvasBackground", "surfaceBackground", "primaryText", "secondaryText", "accent", "outlineSeparators", "primaryInteractive", "primaryInteractiveText", "secondaryInteractive", "secondaryInteractiveText".

	THEME NAME:
	- You can be creative with theme names, adding emojis, emoticons, or special characters is allowed, make it looks nice, well format, and creative.
	- Theme names should be shorter than 30 Characters.
	- DO NOT USE GRAVE ACCENT in theme names

	COLOR DESCRIPTIONS (for context):
	- primaryHeader: The main background for key sections like hero banner, should be easily distinct from canvasBackground and surfaceBackground.
	- secondaryHeader: A secondary color for header gradients or accents, this color should be able to blend with primaryHeader for nice gradients.
	- headerText: The main text color for use on top of the headers.
	- subHeaderText: A less prominent text color for subtitles on headers.
	- canvasBackground: The base background color for the entire application.
	- surfaceBackground: For elements that sit on top of the canvas, like cards or panels.
	- primaryText: The main text color for use on canvas and surface backgrounds.
	- secondaryText: A less prominent text color for details or captions.
	- accent: A vibrant color for grabbing attention, like links or highlights.
	- outlineSeparators: For borders, outlines, or lines that divide content.
	- primaryInteractive: The background for main call-to-action buttons (e.g., "Submit").
	- primaryInteractiveText: Text that sits on top of a primary interactive element.
	- secondaryInteractive: The background for secondary buttons (e.g., "Cancel").
	- secondaryInteractiveText: Text that sits on top of a secondary interactive element.

	ACCESSIBILITY:
	- Ensure WCAG AA readable contrast (ratio >= 4.5:1) for the following pairs:
	- headerText on primaryHeader
	- primaryText on surfaceBackground
	- primaryInteractiveText on primaryInteractive
	- Ensure good contrast (ratio >= 3:1) for the following pairs:
	- subHeaderText on primaryHeader
	- secondaryText on surfaceBackground
	- secondaryInteractiveText on secondaryInteractive
	- If a chosen color fails, adjust the text color (prefer #FFFFFF or #000000) to meet the threshold.

	EXAMPLES (Use as a format guide, but create your own unique themes):
	
	1st Example:
	{
	"themeName": "Sunset Glow",
	"advice": "This warm and inviting theme captures the breathtaking beauty of a sunset, creating an atmosphere that is both dramatic and peaceful. It's perfectly suited for projects that aim to feel personal, inspiring, or creative, such as a travel blog, a photography portfolio, a wellness application, or a boutique brand's website.",
	"colors": {
		"primaryHeader": "#D35400",
		"secondaryHeader": "#F39C12",
		"canvasBackground": "#FDF5E6",
		"surfaceBackground": "#FFFFFF",
		"primaryText": "#34495E",
		"secondaryText": "#7F8C8D",
		"accent": "#E67E22",
		"outlineSeparators": "#DCDCDC",
		"primaryInteractive": "#D35400",
		"primaryInteractiveText": "#FFFFFF",
		"secondaryInteractive": "#F5F5F5",
		"secondaryInteractiveText": "#34495E"
	}
	
	2nd Example:
	{
	"themeName": "Forest",
	"advice": "This calm, nature-forward theme is perfectly suited for wellness brands or environmental sites. The deep green provides a clear call-to-action, while the lighter secondary button is ideal for less critical actions.",
	"colors": {
		"primaryHeader": "#2F4F4F",
		"secondaryHeader": "#556B2F",
		"canvasBackground": "#F0F8FF",
		"surfaceBackground": "#FFFFFF",
		"primaryText": "#2F4F4F",
		"secondaryText": "#696969",
		"accent": "#556B2F",
		"outlineSeparators": "#D3D3D3",
		"primaryInteractive": "#556B2F",
		"primaryInteractiveText": "#FFFFFF",
		"secondaryInteractive": "#D3D3D3",
		"secondaryInteractiveText": "#2F4F4F"
	}

	3rd Example:
	{
	"themeName": "Cyberpunk Night",
	"advice": "A high-energy, futuristic theme perfect for gaming sites, tech blogs, or streaming channels. The vibrant magenta and cyan create a classic neon look against a dark backdrop, ensuring that interactive elements are impossible to miss.",
	"colors": {
		"primaryHeader": "#0D0221",
		"secondaryHeader": "#4A148C",
		"canvasBackground": "#0A0A0A",
		"surfaceBackground": "#1A1A1A",
		"primaryText": "#F0F0F0",
		"secondaryText": "#A0A0A0",
		"accent": "#F400A1",
		"outlineSeparators": "#4A148C",
		"primaryInteractive": "#F400A1",
		"primaryInteractiveText": "#FFFFFF",
		"secondaryInteractive": "#2A2A2A",
		"secondaryInteractiveText": "#00F0FF"
	}

	4th Example:
	{
	"themeName": "Terracotta",
	"advice": "This warm, earthy theme creates a grounded and artisanal feel, ideal for craft e-commerce, pottery studios, or organic lifestyle blogs. It uses natural tones to feel both modern and timeless.",
	"colors": {
		"primaryHeader": "#5D4037",
		"secondaryHeader": "#BF5700",
		"canvasBackground": "#F5F5DC",
		"surfaceBackground": "#FFF8E1",
		"primaryText": "#5D4037",
		"secondaryText": "#8D6E63",
		"accent": "#BF5700",
		"outlineSeparators": "#D7CCC8",
		"primaryInteractive": "#BF5700",
		"primaryInteractiveText": "#FFF8E1",
		"secondaryInteractive": "#D7CCC8",
		"secondaryInteractiveText": "#5D4037"
	}

	5th Example:
	{
	"themeName": "Monochrome",
	"advice": "A clean, minimalist, and professional theme that prioritizes content and readability. It's highly versatile for corporate sites or minimalist blogs. The single accent color draws the user's attention to key actions.",
	"colors": {
		"primaryHeader": "#212121",
		"secondaryHeader": "#424242",
		"canvasBackground": "#F5F5F5",
		"surfaceBackground": "#FFFFFF",
		"primaryText": "#212121",
		"secondaryText": "#757575",
		"accent": "#007BFF",
		"outlineSeparators": "#E0E0E0",
		"primaryInteractive": "#007BFF",
		"primaryInteractiveText": "#FFFFFF",
		"secondaryInteractive": "#E0E0E0",
		"secondaryInteractiveText": "#212121"
	}
	
		REMINDER: Only return the raw JSON object. Do not use markdown like \`\`\`json.`;

	const payload = JSON.stringify({
		contents: [{ parts: [{ text: prompt }] }],
		systemInstruction: { parts: [{ text: systemPrompt }] },
		generationConfig: { responseMimeType: "application/json" },
	});

	const options = {
		hostname: "generativelanguage.googleapis.com",
		path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
		const themeData = req.body;
		const originalName = themeData.themeName;
		let newName = originalName;
		let counter = 2;
		let saved = false;

		// Keep trying to save until it succeeds
		while (!saved) {
			try {
				themeData.themeName = newName;

				const newTheme = new Theme(themeData);
				await newTheme.save();

				// If save() succeeds, exit the loop and send the response
				saved = true;
				res.status(201).json(newTheme);
			} catch (error) {
				// Check if the error is the specific "duplicate key" error (code 11000)
				if (error.code === 11000) {
					// If it is, generate a new name and the loop will try again
					console.log(`Name: ${newName} duplicated, trying a new name...`);

					// Generate a new ObjectId for the new document
					themeData._id = new mongoose.Types.ObjectId();
					newName = `${originalName} (${counter})`;
					counter++;
				} else {
					throw error;
				}
			}
		}
	} catch (error) {
		console.error("Failed to save theme due to an unexpected error:", error);
		res.status(500).json({ error: "Failed to save theme." });
	}
};

const getAllThemes = async (req, res) => {
	try {
		const themes = await Theme.find().sort({ themeName: 1 }); // Sort lexographically by themeName
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

const overwriteTheme = async (req, res) => {
	try {
		// findByIdAndUpdate will find the document and completely replace it with the request body.
		// { new: true } ensures the updated document is returned.
		const updatedTheme = await Theme.findByIdAndUpdate(
			req.params.id,
			req.body, // The entire new theme object from the frontend
			{ new: true, runValidators: true, overwrite: true } // overwrite: true is key for PUT
		);

		if (!updatedTheme) {
			return res.status(404).json({ error: "Theme not found" });
		}
		res.status(200).json(updatedTheme);
	} catch (error) {
		if (error.kind === "ObjectId") {
			return res.status(400).json({ error: "Invalid theme ID format" });
		}
		console.error("Error overwriting theme:", error);
		res.status(500).json({ error: "Failed to overwrite theme." });
	}
};

// Export all the functions
module.exports = {
	generateTheme,
	saveTheme,
	getAllThemes,
	deleteTheme,
	overwriteTheme,
};
