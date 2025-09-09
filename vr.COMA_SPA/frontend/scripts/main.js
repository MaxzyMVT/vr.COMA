// File: r.COMA/frontend/scripts/main.js

document.addEventListener("DOMContentLoaded", () => {
	// --- State ---
	let currentTheme = null;
	let savedThemesCache = [];

	// --- UI Elements ---
	const generateButton = document.getElementById("generate-button");
	const reviseButton = document.getElementById("revise-button");
	const textInput = document.getElementById("text-input");
	const savedThemesList = document.getElementById("saved-themes-list");
	const outputSection = document.getElementById("output-section");
	const previewThemeName = document.getElementById("preview-theme-name");
	const outputContent = document.getElementById("output-content");

	// --- Event Handlers ---
	async function handleGenerateTheme() {
		setLoadingState(true, generateButton, reviseButton);
		try {
			const prompt = textInput.value.trim();
			const themeData = await apiGenerateTheme(prompt); // Call API function
			currentTheme = themeData;
			applyTheme(themeData, previewThemeName); // Call UI function
			displayThemeOutput(themeData, outputContent); // Call UI function

			// After a successful generation, the revise button should be enabled.
			reviseButton.disabled = false;
		} catch (error) {
			console.error(error);
			// Show error on UI
		} finally {
			setLoadingState(false, generateButton, reviseButton);
		}
	}

	async function handleSaveTheme() {
		// Guard Clause: Check if there is a theme to save.
		if (!currentTheme) {
			alert("No theme has been generated yet. Please generate a theme first.");
			return;
		}

		try {
			// Call the API function to do the network request.
			await apiSaveTheme(currentTheme);

			// Give the user feedback.
			alert(`Theme "${currentTheme.themeName}" was saved successfully!`);

			// Refresh the saved themes list to show the new addition.
			await loadAndDisplayThemes();
		} catch (error) {
			console.error("Failed to save theme:", error);
			alert("There was an error saving your theme. Please try again.");
		}
	}

	async function loadAndDisplayThemes() {
		try {
			const themes = await apiLoadThemes();

			savedThemesCache = themes;

			displaySavedThemes(themes);
		} catch (error) {
			console.error("Failed to load and display themes:", error);
			savedThemesList.innerHTML =
				'<p style="color: red;">Could not load saved themes.</p>';
		}
	}

	async function handleDeleteTheme(themeId) {
		// 1. Confirm with the user before deleting.
		if (confirm("Are you sure you want to delete this theme?")) {
			try {
				// 2. Call the dedicated API function.
				await apiDeleteTheme(themeId);

				// 3. Refresh the UI to show the theme has been removed.
				await loadAndDisplayThemes();
			} catch (error) {
				// 4. Show an error message if the API call fails.
				console.error("Error deleting theme:", error);
				alert("Could not delete the theme. Please try again.");
			}
		}
	}

	async function handleReviseTheme() {
		// 1. Guard Clause: Don't do anything if there's no theme to revise.
		if (!currentTheme) {
			alert("Please generate or load a theme before trying to revise it.");
			return;
		}

		const revisionPrompt = textInput.value.trim();
		if (!revisionPrompt) {
			alert("Please describe how you would like to revise the theme.");
			return;
		}

		// 2. Create a more detailed prompt for the AI
		const fullPrompt = `Based on the previous theme named "${currentTheme.themeName}", please revise it with this new instruction: "${revisionPrompt}"`;

		// 3. The rest is very similar to handleGenerateTheme
		setLoadingState(true, generateButton, reviseButton);
		try {
			// We can reuse the same API function!
			const themeData = await apiGenerateTheme(fullPrompt);

			currentTheme = themeData; // Update the state
			applyTheme(themeData, previewThemeName);
			displayThemeOutput(themeData, outputContent);
		} catch (error) {
			console.error("Revision Error:", error);
			alert("There was an error revising the theme. Please try again.");
		} finally {
			setLoadingState(false, generateButton, reviseButton);
		}
	}

	// --- Attach Event Listeners ---
	generateButton.addEventListener("click", handleGenerateTheme);
	reviseButton.addEventListener("click", handleReviseTheme);

	outputSection.addEventListener("click", (event) => {
		if (event.target.id === "save-theme-button") {
			handleSaveTheme();
		}
	});

	savedThemesList.addEventListener("click", (event) => {
		const target = event.target;
		const themeId = target.dataset.id;

		if (target.classList.contains("load-btn")) {
			const themeToLoad = savedThemesCache.find(
				(theme) => theme._id === themeId
			);
			if (themeToLoad) {
				currentTheme = themeToLoad;
				applyTheme(themeToLoad, previewThemeName);
				displayThemeOutput(themeToLoad, outputContent);

				reviseButton.disabled = false;
			}
		}

		if (target.classList.contains("delete-btn")) {
			handleDeleteTheme(themeId);
		}
	});

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
	loadAndDisplayThemes();
});
