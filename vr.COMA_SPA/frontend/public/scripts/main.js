document.addEventListener("DOMContentLoaded", () => {
	// --- State ---
	let currentTheme = null;
	let savedThemesCache = [];

	// Default themes to apply on initial load
	const defaultTheme = {
		themeName: "Default Neutral",
		advice:
			"This is a balanced, neutral theme perfect for professional portfolios, blogs, or business applications. It prioritizes readability and provides a clean, modern starting point.",
		colors: {
			primaryBackground: "#2c3e50",
			canvasBackground: "#ecf0f1",
			primaryText: "#2c3e50",
			secondaryText: "#8b99a9", // FIXED: Was invalid #8j99a9
			accent: "#3498db",
			interactiveBackground: "#3498db",
			interactiveText: "#ffffff",
			surfaceBackground: "#ffffff",
			outlineSeparators: "#bdc3c7",
		},
	};

	const defaultThemeDark = {
		themeName: "Default Dark",
		advice:
			"A sleek, dark theme that's easy on the eyes. Great for dashboards, code editors, or any application where users spend a lot of time.",
		colors: {
			primaryBackground: "#212529", // CORRECTED: Was a light color, now it's dark gray
			canvasBackground: "#121212",
			primaryText: "#e9ecef",
			secondaryText: "#adb5bd",
			accent: "#5294e2",
			interactiveBackground: "#5294e2",
			interactiveText: "#ffffff",
			surfaceBackground: "#1e1e1e",
			outlineSeparators: "#495057",
		},
	};
	// --- UI Elements ---
	const titleHeader = document.querySelector(".app-header h1");
	const textInput = document.getElementById("text-input");
	const savedThemesList = document.getElementById("saved-themes-list");
	const generateButton = document.getElementById("generate-button");
	const reviseButton = document.getElementById("revise-button");
	const outputSection = document.getElementById("output-section");
	const previewThemeName = document.getElementById("preview-theme-name");
	const outputContent = document.getElementById("output-content");

	// --- Event Handlers ---
	async function handleGenerateTheme(promptOverride) {
		setLoadingState(true, generateButton, reviseButton);
		try {
			const prompt = promptOverride || textInput.value.trim();
			if (!prompt) {
				alert("Please enter a description for the theme.");
				return;
			}

			const themeData = await apiGenerateTheme(prompt); // Call API function
			currentTheme = themeData;
			applyTheme(themeData, previewThemeName); // Call UI function
			displayThemeOutput(themeData, outputContent); // Call UI function

			reviseButton.disabled = false;
		} catch (error) {
			console.error(error);
			alert("An error occurred while generating the theme. Please check the console.");
		} finally {
			setLoadingState(false, generateButton, reviseButton);
		}
	}

	async function handleSaveTheme() {
		if (!currentTheme) {
			alert("No theme has been generated yet. Please generate a theme first.");
			return;
		}
		try {
			await apiSaveTheme(currentTheme);
			alert(`Theme "${currentTheme.themeName}" was saved successfully!`);
			await loadAndDisplayThemes();
		} catch (error) {
			console.error("Failed to save theme:", error);
			alert("There was an error saving your theme. Please try again.");
		}
	}

	async function loadAndDisplayThemes() {
		try {
			savedThemesCache = await apiLoadThemes();
			displaySavedThemes(savedThemesCache);
		} catch (error) {
			console.error("Failed to load and display themes:", error);
			savedThemesList.innerHTML = '<p style="color: red;">Could not load saved themes.</p>';
		}
	}

	async function handleDeleteTheme(themeId) {
		if (confirm("Are you sure you want to delete this theme?")) {
			try {
				await apiDeleteTheme(themeId);
				await loadAndDisplayThemes();
			} catch (error) {
				console.error("Error deleting theme:", error);
				alert("Could not delete the theme. Please try again.");
			}
		}
	}

    async function handleRenameTheme(themeId) {
        const theme = savedThemesCache.find(t => t._id === themeId);
        if (!theme) return;

        const newName = prompt("Enter the new name for this theme:", theme.themeName);

        if (newName && newName.trim() !== "") {
            try {
                await apiRenameTheme(themeId, newName.trim());
                await loadAndDisplayThemes(); // Refresh list to show the new name
            } catch (error) {
                console.error("Error renaming theme:", error);
                alert("Could not rename the theme. Please try again.");
            }
        }
    }

	async function handleReviseTheme() {
		if (!currentTheme) {
			alert("Please generate or load a theme before trying to revise it.");
			return;
		}

		const revisionPrompt = textInput.value.trim();
		if (!revisionPrompt) {
			alert("Please describe how you would like to revise the theme.");
			return;
		}

		const fullPrompt = `Based on the previous theme named "${currentTheme.themeName}", please revise it with this new instruction: "${revisionPrompt}"`;
		await handleGenerateTheme(fullPrompt);
	}

	async function handleMakeDark() {
		if (!currentTheme) {
			alert("Please generate or load a theme first.");
			return;
		}
		const darkPrompt = `Create a dark mode version of the theme named "${currentTheme.themeName}". The new name should be "${currentTheme.themeName}_dark". Keep the spirit of the original colors but adapt them for a dark background.`;
		await handleGenerateTheme(darkPrompt);
	}


	// --- Event Listeners ---
	generateButton.addEventListener("click", () => handleGenerateTheme());
	reviseButton.addEventListener("click", handleReviseTheme);

	outputSection.addEventListener("click", (event) => {
		if (event.target.id === "save-theme-button") {
			handleSaveTheme();
		}
        if (event.target.id === "make-dark-button") {
            handleMakeDark();
        }
	});

	savedThemesList.addEventListener("click", (event) => {
		const target = event.target;
		const themeId = target.dataset.id;
		if (!themeId) return;

		if (target.classList.contains("load-btn")) {
			const themeToLoad = savedThemesCache.find((theme) => theme._id === themeId);
			if (themeToLoad) {
				currentTheme = themeToLoad;
				applyTheme(themeToLoad, previewThemeName);
				displayThemeOutput(themeToLoad, outputContent);
				reviseButton.disabled = false;
			}
		} else if (target.classList.contains("rename-btn")) {
            handleRenameTheme(themeId);
        } else if (target.classList.contains("delete-btn")) {
			handleDeleteTheme(themeId);
		}
	});

	titleHeader.addEventListener("click", () => {
		initializeApp();
	});

	window.addEventListener('theme:changed', (e) => {
		const isDarkMode = e.detail.mode === 'dark';
		// Only switch default theme if a default theme is currently active
		if (currentTheme === defaultTheme || currentTheme === defaultThemeDark) {
			currentTheme = isDarkMode ? defaultThemeDark : defaultTheme;
			applyTheme(currentTheme, previewThemeName);
			displayThemeOutput(currentTheme, outputContent);
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
	function initializeApp() {
		const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
		currentTheme = isDarkMode ? defaultThemeDark : defaultTheme;
		textInput.value = "";
		applyTheme(currentTheme, previewThemeName);
		displayThemeOutput(currentTheme, outputContent);
		loadAndDisplayThemes();
	}

	initializeApp();
});