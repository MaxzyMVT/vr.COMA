import { BACKEND_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
	// UI Elements
	const textInput = document.getElementById("text-input");
	const generateButton = document.getElementById("generate-button");
	const reviseButton = document.getElementById("revise-button");
	const outputContent = document.getElementById("output-content");
	const previewThemeName = document.getElementById("preview-theme-name");
	const savedThemesList = document.getElementById("saved-themes-list");

	// State
	let currentTheme = null; // Holds the last generated theme data
	let savedThemesCache = [];

	// --- Event Listeners ---
	generateButton.addEventListener("click", () => handleThemeGeneration(false));
	reviseButton.addEventListener("click", () => handleThemeGeneration(true));

	// --- Core Functions ---
	const handleThemeGeneration = async (isRevision) => {
		const prompt = textInput.value.trim();
		if (!prompt) {
			alert("Please enter a description for your theme.");
			return;
		}

		setLoadingState(true);

		const fullPrompt =
			isRevision && currentTheme
				? `Based on the previous theme named "${currentTheme.themeName}", please revise it with this new instruction: "${prompt}"`
				: prompt;

		try {
			const response = await fetch(`${BACKEND_URL}/api/generate-theme`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ prompt: fullPrompt }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(
					errorData.error || "Failed to get a response from the server."
				);
			}

			const themeData = await response.json();

			if (themeData && themeData.colors && themeData.themeName) {
				currentTheme = themeData;
				applyTheme(themeData);
				displayThemeOutput(themeData);
			} else {
				// The data from the server was not a valid theme
				console.error("Received invalid theme data:", themeData);
				throw new Error(
					"The generated theme was incomplete. Please try a different prompt."
				);
			}
		} catch (error) {
			console.error("Theme generation error:", error);
			outputContent.innerHTML = `<p class="error" style="color: red;">Error: ${error.message}</p>`;
		} finally {
			setLoadingState(false);
		}
	};

	const applyTheme = (theme) => {
		if (!theme || !theme.colors) return;
		const root = document.documentElement;
		// Map colors from themeData to CSS variables
		const colorMap = {
			"--header-bg": theme.colors.headerBackground,
			"--main-bg": theme.colors.mainBackground,
			"--primary-text": theme.colors.primaryText,
			"--secondary-text": theme.colors.secondaryText,
			"--accent": theme.colors.accent,
			"--btn-bg": theme.colors.buttonBackground,
			"--btn-text": theme.colors.buttonText,
			"--container-bg": theme.colors.containerBackground,
			"--border-color": theme.colors.borderColor,
		};

		for (const [variable, color] of Object.entries(colorMap)) {
			root.style.setProperty(variable, color);
		}

		previewThemeName.textContent = theme.themeName;
	};

	const displayThemeOutput = (theme) => {
		let colorChipsHTML = "";
		for (const [name, color] of Object.entries(theme.colors)) {
			colorChipsHTML += `
                <div class="color-chip" title="Click to copy" onclick="copyToClipboard('${color}')">
                    <div class="color-swatch" style="background-color: ${color};"></div>
                    <div class="color-info">
                        <span class="color-name">${name
													.replace(/([A-Z])/g, " $1")
													.trim()}</span>
                        <span>${color}</span>
                    </div>
                </div>`;
		}

		outputContent.innerHTML = `
            <h3>${theme.themeName}</h3>
            <p>${theme.advice}</p>
            <div class="color-palette">${colorChipsHTML}</div>
            <button id="save-theme-button">Save Theme</button>
        `;
		// Add event listener to the newly created save button
		document
			.getElementById("save-theme-button")
			.addEventListener("click", saveCurrentTheme);
	};

	// --- CRUD Functions for Saved Themes ---
	const saveCurrentTheme = async () => {
		if (!currentTheme) return;
		try {
			// IMPORTANT: Use the full backend URL
			await fetch(`${BACKEND_URL}/api/themes`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(currentTheme),
			});
			loadSavedThemes();
		} catch (error) {
			console.error("Error saving theme:", error);
		}
	};

	const loadSavedThemes = async () => {
		try {
			const response = await fetch(`${BACKEND_URL}/api/themes`);
			const themes = await response.json();
			
			savedThemesCache = themes; // <-- 1. Store the fetched themes in our cache

			savedThemesList.innerHTML = ''; // Clear current list
			themes.forEach(theme => {
				const themeItem = document.createElement('div');
				themeItem.className = 'saved-theme-item';

				// 2. VITAL CHANGE: Use data-id for BOTH buttons. Remove data-theme.
				themeItem.innerHTML = `
					<span>${theme.themeName}</span>
					<div>
						<button class="load-btn" data-id="${theme._id}">Load</button>
						<button class="delete-btn" data-id="${theme._id}">Delete</button>
					</div>`;
				savedThemesList.appendChild(themeItem);
			});
		} catch (error) {
			console.error('Error loading themes:', error);
		}
	};

	// Use event delegation for load/delete buttons
	savedThemesList.addEventListener('click', async (e) => {
		// --- START: Replace the 'load-btn' logic with this ---
		if (e.target.classList.contains('load-btn')) {
			const themeId = e.target.dataset.id;
			
			// Find the full theme object in our cache using its ID
			const themeToLoad = savedThemesCache.find(theme => theme._id === themeId);

			if (themeToLoad) {
				currentTheme = themeToLoad;
				applyTheme(themeToLoad);
				displayThemeOutput(themeToLoad);
			} else {
				console.error('Could not find theme in cache with id:', themeId);
			}
		}
		// --- END: Replacement ---
		if (e.target.classList.contains('delete-btn')) {
			const themeId = e.target.dataset.id;
			if (confirm('Are you sure you want to delete this theme?')) {
				try {
					await fetch(`${BACKEND_URL}/api/themes/${themeId}`, { method: 'DELETE' });
					loadSavedThemes(); // Refresh list after deletion
				} catch (error) {
					console.error('Error deleting theme:', error);
				}
			}
		}
	});

	// --- Utility Functions ---
	const setLoadingState = (isLoading) => {
		generateButton.disabled = isLoading;
		reviseButton.disabled = isLoading;
		generateButton.textContent = isLoading ? "Generating..." : "Generate";
		if (currentTheme) reviseButton.disabled = isLoading;
	};

	// Helper function to copy color code
	window.copyToClipboard = (text) => {
		navigator.clipboard
			.writeText(text)
			.then(() => {
				alert(`Copied "${text}" to clipboard!`);
			})
			.catch((err) => {
				console.error("Failed to copy text: ", err);
			});
	};

	// --- Initial Load ---
	loadSavedThemes();
});
