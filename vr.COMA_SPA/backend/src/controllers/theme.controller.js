const https = require("https");
const Theme = require("../models/theme.model");
const mongoose = require("mongoose");

// Helper function to ensure isDark is always a valid boolean
function normalizeIsDark(payload) {
	if (typeof payload.isDark !== "boolean") {
		const name = payload?.themeName || "";
		if (/\(Night\)\s*$/i.test(name) || /\(Dark\)\s*$/i.test(name)) {
			payload.isDark = true;
		} else {
			payload.isDark = false;
		}
	}
	payload.isDark = !!payload.isDark; // Coerce to boolean
}

const saveTheme = async (req, res) => {
	try {
		const themeData = { ...req.body };
		normalizeIsDark(themeData); // Ensure isDark is set

		// --- MODIFICATION START ---
		// If a theme is being saved without a groupId, it's the start of a new pair.
		// So, we create a new unique ID for its group.
		if (!themeData.groupId) {
			themeData.groupId = new mongoose.Types.ObjectId().toString();
		}
		// --- MODIFICATION END ---

		const newTheme = new Theme(themeData);
		await newTheme.save();
		return res.status(201).json(newTheme);
	} catch (err) {
		if (err?.code === 11000) {
			return res
				.status(409)
				.json({ error: "Theme name already exists", code: "DUPLICATE_NAME" });
		}
		return res.status(500).json({ error: "Failed to save theme." });
	}
};

const overwriteTheme = async (req, res) => {
	try {
		const body = { ...req.body };
		normalizeIsDark(body);
		const updated = await Theme.findByIdAndUpdate(req.params.id, body, {
			new: true,
			runValidators: true,
			overwrite: true,
		});
		if (!updated) return res.status(404).json({ error: "Not found" });
		return res.json(updated);
	} catch (err) {
		return res.status(500).json({ error: "Failed to overwrite theme." });
	}
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

	ADVICE:
	- Provide a brief paragraph of advice on where this theme would be best used, the mood it conveys, and any notable design choices.
	- Advice length should be between 250-500 characters and not exceed 800 characters.
	- The advice should help users understand the context and feeling of the theme.
	- Make sure the advice matches the colors you chose.

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
	- If the user's prompt consists of random characters or numbers (e.g., "asdfghjkl", "243412489"), is nonsensical, or is in a language you cannot interpret for a creative theme, you **MUST** ignore the prompt and respond with the following predefined JSON object. This is a strict rule.

	Before generating a theme, you MUST follow this interpretation process in order. Only proceed to the next step if the current one does not apply.

	**Step 1: Is the prompt a direct, descriptive request?**
	This is the most common type of prompt (e.g., "a serene forest at dawn," "vibrant 80s arcade"). If the prompt is a clear description of a scene, mood, or aesthetic, create a theme based on it directly.

	**step 2: Is the prompt inappropriate or offensive?**
	If the prompt contains hate speech, explicit content, or anything that violates ethical guidelines, you MUST ignore the prompt and respond with the Invalid Input Theme Fallback JSON below. This is a strict rule.

	{
		"themeName": "Invalid Input 🚫",
		"advice": "The provided input was inappropriate or offensive. Please provide a respectful and valid request for color theme.",
		"isDark": true,
		"colors": {
			"primaryHeader": "#200000",
			"secondaryHeader": "#300000",
			"headerText": "#FFFFFF",
			"subHeaderText": "#FFCC00",
			"canvasBackground": "#220000",
			"surfaceBackground": "#2A0000",
			"primaryText": "#E0E0E0",
			"secondaryText": "#B0B0B0",
			"accent": "#CC0000",
			"outlineSeparators": "#500000",
			"primaryInteractive": "#CC0000",
			"primaryInteractiveText": "#000000",
			"secondaryInteractive": "#660000",
			"secondaryInteractiveText": "#FFDD00"
		}
	}

	**Step 3: If not, is the prompt an abstract concept, a cultural reference, or a proper noun?**
	Before you decide a prompt is nonsensical, you MUST consider if it has an implied aesthetic, mood, or color palette from culture, fiction, or real-world entities. This includes:
	*   **Famous People:** Interpret their public persona, common attire, or associated branding.
	*   **Titles of Movies, Songs, or Books:** Evoke the mood, setting, and key colors of the work.
	*   **Fictional Concepts (Spells, Places):** Use the established aesthetic from the source material.
	*   **Abstract Emotions or Ideas:** (e.g., "Melancholy," "Ambition").

	**Examples of Creative Interpretation (Follow this model):**

   	**Prompt:** "Donald Trump"
    *   **Your Reasoning:** This is a famous political figure. The associated aesthetic is often formal and patriotic. Key colors are navy blue (suits), white (shirts), red (ties), and gold (branding). The theme should feel powerful, formal, and executive.
    *   **Your Output:**
        {
          "themeName": "The Executive",
          "advice": "A powerful and formal theme inspired by classic political and corporate aesthetics. The deep navy and crisp white create a professional foundation, while the bold red accent commands attention for key actions. Ideal for business, finance, or news applications.",
          "colors": {
            "primaryHeader": "#00204E",
            "secondaryHeader": "#001A3D",
            "headerText": "#FFFFFF",
            "subHeaderText": "#E1E1E1",
            "canvasBackground": "#F8F9FA",
            "surfaceBackground": "#FFFFFF",
            "primaryText": "#212529",
            "secondaryText": "#495057",
            "accent": "#B31942",
            "outlineSeparators": "#DEE2E6",
            "primaryInteractive": "#B31942",
            "primaryInteractiveText": "#FFFFFF",
            "secondaryInteractive": "#E9ECEF",
            "secondaryInteractiveText": "#212529"
          }
        }

   	**Prompt:** "Avada Kedavra"
    *   **Your Reasoning:** This is a well-known magic spell from Harry Potter, the "Killing Curse." Its signature color is a blast of blinding, sickly green light. The mood is dark, malevolent, and magical. The theme must be dark and feature a vibrant, toxic green.
    *   **Your Output:**
        {
          "themeName": "Curse Green",
          "advice": "A dark and sinister theme inspired by forbidden magic. The deep charcoal backgrounds create a menacing atmosphere, while the shockingly vibrant green accent is used for dangerous, high-impact actions. Ideal for gaming, fantasy, or any project with a dark, magical edge.",
          "colors": {
            "primaryHeader": "#1A1A1A",
            "secondaryHeader": "#0D0221",
            "headerText": "#FFFFFF",
            "subHeaderText": "#50C878",
            "canvasBackground": "#121212",
            "surfaceBackground": "#1E1E1E",
            "primaryText": "#EAEAEA",
            "secondaryText": "#888888",
            "accent": "#00FF66",
            "outlineSeparators": "#333333",
            "primaryInteractive": "#00FF66",
            "primaryInteractiveText": "#000000",
            "secondaryInteractive": "#333333",
            "secondaryInteractiveText": "#EAEAEA"
          }
        }

	**Step 4: If all interpretation fails, use the Illegible Theme Fallback.**
	This is your **last resort**. Only use this if the prompt is a truly random string of characters (e.g., "asdfghjk"), a keyboard smash (e.g., "adfhadfh"), a random series of numbers, or has absolutely no discernible meaning or cultural context that you can interpret.

   	**Illegible Theme Fallback JSON (Use this EXACT object if prompt is uninterpretable):**
    {
      "themeName": "Illegible Theme 🌫️",
      "advice": "This is a fallback theme generated because the input was unclear. It uses a palette of muted, low-energy colors that technically meet accessibility standards but are designed to feel indistinct and visually confusing. Please try again with a clear, descriptive prompt like 'a vibrant retro arcade' or 'a calm, snowy morning'.",
      "colors": {
        "primaryHeader": "#BCC6CC",
        "secondaryHeader": "#C5D1D9",
        "headerText": "#2F4F4F",
        "subHeaderText": "#708090",
        "canvasBackground": "#F0F0F0",
        "surfaceBackground": "#F5F5F5",
        "primaryText": "#696969",
        "secondaryText": "#808080",
        "accent": "#5F9EA0",
        "outlineSeparators": "#DCDCDC",
        "primaryInteractive": "#5F9EA0",
        "primaryInteractiveText": "#FFFFFF",
        "secondaryInteractive": "#DCDCDC",
        "secondaryInteractiveText": "#2F4F4F"
      }
    }
		
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
				const responseJson = JSON.parse(data);

				const parts = responseJson?.candidates?.[0]?.content?.parts ?? [];
				const rawText = parts
					.map((p) => p?.text)
					.filter(Boolean)
					.join("\n");

				const themeData = extractJsonObject(rawText);

				inferIsDark(themeData);
				themeData.isDark = !!themeData.isDark;

				if (!themeData.colors || !themeData.colors.canvasBackground) {
					throw new Error("Theme missing colors.canvasBackground");
				}

				res.json(themeData);
			} catch (err) {
				console.error("AI theme parse error:", err?.message || err, {
					data: String(data).slice(0, 500),
				});
				res.status(502).json({
					error: "Bad AI response",
					detail: String(err?.message || err),
				});
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

const invertThemeByAI = (req, res) => {
	const { currentTheme } = req.body;
	if (!currentTheme) {
		return res.status(400).json({ error: "Current theme data is required." });
	}

	const targetMode = currentTheme.isDark ? "Light (Day)" : "Dark (Night)";
	const newIsDark = !currentTheme.isDark;

	const systemPrompt = `You are a theme inverter for a design application. You will be given a JSON object for an existing color theme. Your task is to generate the **${targetMode}** version of this theme.

	- **Maintain the Mood:** The new theme must keep the same essential mood, style, and core color identity. For example, if the original accent color was green, the new accent should also be a shade of green that fits the new ${targetMode} mode.
	- **Follow All Rules:** You must follow all the same JSON structure, key names, and accessibility requirements as the original theme generation prompt.
	- **Do Not Copy:** Do not simply return the same theme. You must generate a new, thoughtfully crafted ${targetMode} palette.
	- **Do Not Too Strict with Light or Dark:** Just make the colors inverted, but the overall theme mood should match the advice.  

	REQUIREMENTS:
	- The root object must contain keys: "themeName", "advice", and "colors".
	- The "colors" object must contain EXACTLY these 14 keys, in this order:
	"primaryHeader", "secondaryHeader", "headerText", "subHeaderText", "canvasBackground", "surfaceBackground", "primaryText", "secondaryText", "accent", "outlineSeparators", "primaryInteractive", "primaryInteractiveText", "secondaryInteractive", "secondaryInteractiveText".

	THEME NAME:
	- You can be creative with theme names, adding emojis, emoticons, or special characters is allowed, make it looks nice, well format, and creative.
	- Theme names should be shorter than 30 Characters.
	- Be creative: by using the opposite words of an old themeName for a new themeName, but if you couldn't think of the opposite word just add (Light) / (Dark) or (Day) / (Night)
	- DO NOT USE GRAVE ACCENT in theme names

	COLOR DESCRIPTIONS (for context):
	- primaryHeader: The main background for key sections like hero banner, should be easily distinct from canvasBackground and surfaceBackground, not necessary be light or dark, should be distinct and match the theme mood in advice.
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

	Please make sure of these requirements above.

	REMINDER: Only return the raw JSON object. Do not use markdown like \`\`\`json.
	`;

	const prompt = `Here is the theme to invert: ${JSON.stringify(
		currentTheme,
		null,
		2
	)}`;

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
		apiRes.on("data", (chunk) => (data += chunk));
		apiRes.on("end", () => {
			try {
				if (apiRes.statusCode !== 200)
					throw new Error(`API Error: ${apiRes.statusCode}`);
				const responseJson = JSON.parse(data);
				const rawText = responseJson.candidates[0].content.parts[0].text;
				const themeData = JSON.parse(rawText);

				themeData.isDark = newIsDark;

				// --- MODIFICATION START ---
				// Ensure the new inverted theme shares the same groupId as the original.
				themeData.groupId = currentTheme.groupId;
				// --- MODIFICATION END ---

				res.json(themeData);
			} catch (error) {
				console.error("Error parsing inversion response:", error);
				res
					.status(500)
					.json({ error: "Failed to parse inverted theme from API." });
			}
		});
	});

	apiRequest.on("error", (error) =>
		res.status(500).json({ error: "Failed to generate inverted theme." })
	);
	apiRequest.write(payload);
	apiRequest.end();
};

const normalizeString = (str) => {
	return str.replace(/[^a-zA-Z]/g, "").toLowerCase();
};

const getAllThemes = async (req, res) => {
	try {
		const themes = await Theme.find();
		themes.sort((a, b) => {
			const nameA = normalizeString(a.themeName);
			const nameB = normalizeString(b.themeName);
			const aIsEmpty = nameA === "";
			const bIsEmpty = nameB === "";
			if (aIsEmpty && bIsEmpty) {
				return a.themeName.localeCompare(b.themeName);
			}
			if (aIsEmpty) {
				return 1;
			}
			if (bIsEmpty) {
				return -1;
			}
			if (nameA !== nameB) {
				return nameA.localeCompare(nameB);
			}
			return a.themeName.localeCompare(b.themeName);
		}); // Sort lexicographically by themeName (#3 IMPROVED XD)
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

function hexToLuminance(hex) {
	if (typeof hex !== "string") return null;
	const h = hex.replace("#", "");
	if (!/^[0-9a-f]{6}$/i.test(h)) return null;
	const r = parseInt(h.slice(0, 2), 16) / 255;
	const g = parseInt(h.slice(2, 4), 16) / 255;
	const b = parseInt(h.slice(4, 6), 16) / 255;
	const lin = (v) =>
		v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function inferIsDark(theme) {
	if (typeof theme.isDark === "boolean") return;
	const bg =
		theme?.colors?.canvasBackground ??
		theme?.colors?.background ??
		theme?.background ??
		null;
	const L = hexToLuminance(bg);
	theme.isDark = L !== null ? L < 0.5 : false;
}

function extractJsonObject(text) {
	if (typeof text !== "string") throw new Error("No text to parse");
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	let candidate = fenced ? fenced[1] : text;
	const start = candidate.indexOf("{");
	const end = candidate.lastIndexOf("}");
	if (start === -1 || end === -1 || end <= start)
		throw new Error("No JSON object found in model output");
	candidate = candidate.slice(start, end + 1);
	return JSON.parse(candidate);
}

module.exports = {
	generateTheme,
	saveTheme,
	getAllThemes,
	deleteTheme,
	overwriteTheme,
	invertThemeByAI,
};
