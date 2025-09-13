document.addEventListener("DOMContentLoaded", () => {
	// --- State ---
	let currentTheme = null;
	let initialTheme = null; // The first theme generated or loaded for a group
	let invertedThemeCache = null; // Stores the AI-generated counterpart
	const themeCache = new Map(); // groupId -> { light, dark }
	let savedThemesCache = [];
	let colorKeyToEdit = null;
	let originalColorBeforeEdit = null;

	// Default theme to apply on initial load
	const defaultTheme = {
		themeName: "Default Neutral",
		isDark: false,
		advice:
			"This is a balanced, neutral theme perfect for professional portfolios, blogs, or business applications. It prioritizes readability and provides a clean, modern starting point.",
		colors: {
			primaryHeader: "#2c3e50",
			secondaryHeader: "#34495e",
			headerText: "#ffffff",
			subHeaderText: "#bdc3c7",
			canvasBackground: "#ecf0f1",
			surfaceBackground: "#ffffff",
			primaryText: "#2c3e50",
			secondaryText: "#7f8c8d",
			accent: "#3498db",
			outlineSeparators: "#bdc3c7",
			primaryInteractive: "#3498db",
			primaryInteractiveText: "#ffffff",
			secondaryInteractive: "#bdc3c7",
			secondaryInteractiveText: "#2c3e50",
		},
	};

	// --- UI Elements ---
	const titleHeader = document.querySelector(".app-header h1");
	const textInput = document.getElementById("text-input");
	const searchInput = document.getElementById("search-input");
	const savedThemesList = document.getElementById("saved-themes-list");
	const generateButton = document.getElementById("generate-button");
	const reviseButton = document.getElementById("revise-button");
	const outputSection = document.getElementById("output-section");
	const outputContent = document.getElementById("output-content");
	const uiModeToggle = document.getElementById("ui-mode-toggle");

	// --- Modals ---
	const modalColorPicker = document.getElementById("modal-color-picker");
	const modalColorHex = document.getElementById("modal-color-hex");
	const modalCopyBtn = document.getElementById("modal-copy-btn");
	const modalColorCloseBtn = document.getElementById("modal-color-close-btn");
	const modalColorCancelBtn = document.getElementById("modal-color-cancel-btn");

	// --- Event Handlers ---
	async function handleGenerateTheme() {
		setLoadingState(true, generateButton, reviseButton);
		try {
			const prompt = textInput.value.trim();
			const themeData = await apiGenerateTheme(prompt);

			if (themeData.colors && themeData.colors.canvasBackground) {
				const lightness = hexToHsl(themeData.colors.canvasBackground).l;
				themeData.isDark = lightness < 0.5;
			} else {
				themeData.isDark = false;
			}

			currentTheme = themeData;
			applyTheme(themeData);
			displayThemeOutput(themeData, outputContent);
			reviseButton.disabled = false;
		} catch (error) {
			console.error(error);
			alert("Could not generate the theme. Please try again.");
		} finally {
			setLoadingState(false, generateButton, reviseButton);
		}
	}

	async function handleSaveTheme() {
		if (!currentTheme) {
			alert("No theme has been generated yet.");
			return;
		}

		// --- FIX: Check for existing name and prompt to overwrite ---
		const existingTheme = savedThemesCache.find(
			(t) => t.themeName === currentTheme.themeName
		);

		if (existingTheme) {
			if (
				confirm(
					`A theme named "${currentTheme.themeName}" already exists. Do you want to overwrite it?`
				)
			) {
				// User wants to overwrite, so call the overwrite handler
				await handleOverwriteTheme(existingTheme._id, true);
			}
			// If user cancels, do nothing.
			return;
		}
		// --- End of Fix ---

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
			const themes = await apiLoadThemes();
			savedThemesCache = themes;
			displaySavedThemes(themes);
		} catch (error) {
			console.error("Failed to load and display themes:", error);
			savedThemesList.innerHTML =
				'<p style="color: red;">Could not load saved themes.</p>';
		}
	}

	async function handleSearch() {
		const searchText = searchInput.value.toLowerCase().trim();
		const filteredThemes = savedThemesCache.filter((theme) =>
			theme.themeName.toLowerCase().includes(searchText)
		);
		displaySavedThemes(filteredThemes);
		if (filteredThemes.length === 0 && searchText) {
			savedThemesList.innerHTML = `<p>No themes found matching "${searchText}".</p>`;
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
		const fullPrompt = `Based on the previously generated theme named "${
			currentTheme.themeName
		}", which has this JSON data: ${JSON.stringify(
			currentTheme
		)}, please revise and improve it with this new instruction: "${revisionPrompt}"`;

		setLoadingState(true, generateButton, reviseButton);
		try {
			const themeData = await apiGenerateTheme(fullPrompt);

			if (themeData.colors && themeData.colors.canvasBackground) {
				const lightness = hexToHsl(themeData.colors.canvasBackground).l;
				themeData.isDark = lightness < 0.5;
			} else {
				themeData.isDark = false;
			}

			currentTheme = themeData;
			applyTheme(themeData);
			displayThemeOutput(themeData, outputContent);
		} catch (error) {
			console.error("Revision Error:", error);
			alert("There was an error revising the theme. Please try again.");
		} finally {
			setLoadingState(false, generateButton, reviseButton);
		}
	}

	async function handleOverwriteTheme(themeId, silent = false) {
		if (!currentTheme) {
			alert(
				"Please generate or revise a theme first before trying to overwrite another."
			);
			return;
		}
		const themeToOverwrite = savedThemesCache.find((t) => t._id === themeId);
		if (!themeToOverwrite) return;

		const doOverwrite =
			silent ||
			confirm(
				`Are you sure you want to overwrite "${themeToOverwrite.themeName}" with the currently generated theme? This cannot be undone.`
			);

		if (doOverwrite) {
			try {
				await apiOverwriteTheme(themeId, currentTheme);
				if (!silent)
					alert(`Successfully updated "${themeToOverwrite.themeName}"!`);
				await loadAndDisplayThemes();
			} catch (error) {
				console.error("Error overwriting theme:", error);
				alert("Could not update the theme. Please try again.");
			}
		}
	}

	// --- Event Listeners ---
	generateButton.addEventListener("click", handleGenerateTheme);
	reviseButton.addEventListener("click", handleReviseTheme);
	searchInput.addEventListener("input", handleSearch);

	// --- REWRITTEN: Event listener for AI-powered theme inversion ---
	uiModeToggle.addEventListener("click", async () => {
		if (!currentTheme) return;

		const originalTitle = uiModeToggle.title;
		uiModeToggle.disabled = true;
		uiModeToggle.title = "Generating...";

		try {
			// Call the new API function that asks the AI to invert the theme
			const invertedTheme = await apiInvertThemeByAI(currentTheme);

			currentTheme = invertedTheme;
			applyTheme(currentTheme);
			displayThemeOutput(currentTheme, outputContent);
		} catch (error) {
			console.error("Failed to get AI-inverted theme:", error);
			alert(
				"There was an error generating the theme variant. Please try again."
			);
		} finally {
			uiModeToggle.disabled = false;
			// The title will be updated automatically by applyTheme -> setUiIcon
		}
	});

	outputSection.addEventListener("click", (event) => {
		if (event.target.id === "save-theme-button") {
			handleSaveTheme();
		}
		const editNameBtn = event.target.closest(".edit-theme-name-btn");
		if (editNameBtn) {
			const h3 = document.getElementById("current-theme-name");
			const header = h3.parentElement;
			const input = document.createElement("input");
			input.type = "text";
			input.value = currentTheme.themeName;
			input.className = "theme-name-input";

			const saveAndExitEditMode = () => {
				const newName = input.value.trim();
				if (newName) {
					currentTheme.themeName = newName;
					displayThemeOutput(currentTheme, outputContent);
					applyTheme(currentTheme);
				} else {
					displayThemeOutput(currentTheme, outputContent);
				}
			};

			input.addEventListener("blur", saveAndExitEditMode);
			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") saveAndExitEditMode();
				else if (e.key === "Escape")
					displayThemeOutput(currentTheme, outputContent);
			});

			header.innerHTML = "";
			header.appendChild(input);
			input.focus();
		}

		const colorChip = event.target.closest(".color-chip");
		if (colorChip) {
			colorKeyToEdit = colorChip.dataset.key;
			const currentColor = currentTheme.colors[colorKeyToEdit];
			originalColorBeforeEdit = currentColor;
			showColorEditorModal(colorKeyToEdit, currentColor);
		}
	});

	savedThemesList.addEventListener("click", (event) => {
		const saveBtn = event.target.closest(".save-btn");
		if (saveBtn) {
			event.stopPropagation();
			handleOverwriteTheme(saveBtn.dataset.id);
			return;
		}

		const deleteBtn = event.target.closest(".delete-btn");
		if (deleteBtn) {
			event.stopPropagation();
			handleDeleteTheme(deleteBtn.dataset.id);
			return;
		}

		const loadBtn = event.target.closest(".load-btn");
		if (loadBtn) {
			const themeId = loadBtn.dataset.id;
			const themeToLoad = savedThemesCache.find((t) => t._id === themeId);
			if (themeToLoad) {
				currentTheme = themeToLoad;
				applyTheme(themeToLoad);
				displayThemeOutput(themeToLoad, outputContent);
				reviseButton.disabled = false;
			}
		}
	});

	titleHeader.addEventListener("click", () => {
		currentTheme = defaultTheme;
		textInput.value = "";
		applyTheme(defaultTheme);
		displayThemeOutput(defaultTheme, outputContent);
	});

	modalColorPicker.addEventListener("input", () => {
		const newColor = modalColorPicker.value;
		modalColorHex.value = newColor;
		currentTheme.colors[colorKeyToEdit] = newColor;
		applyTheme(currentTheme);
	});

	modalColorHex.addEventListener("input", () => {
		const newColor = modalColorHex.value;
		if (/^#[0-9A-F]{6}$/i.test(newColor)) {
			modalColorPicker.value = newColor;
			currentTheme.colors[colorKeyToEdit] = newColor;
			applyTheme(currentTheme);
		}
	});

	modalCopyBtn.addEventListener("click", () => {
		navigator.clipboard.writeText(modalColorHex.value);
	});

	modalColorCancelBtn.addEventListener("click", () => {
		currentTheme.colors[colorKeyToEdit] = originalColorBeforeEdit;
		applyTheme(currentTheme);
		displayThemeOutput(currentTheme, outputContent);
		hideColorEditorModal();
	});

	modalColorCloseBtn.addEventListener("click", () => {
		displayThemeOutput(currentTheme, outputContent);
		hideColorEditorModal();
	});

	// --- Initial Load ---
	function initializeApp() {
		currentTheme = defaultTheme;
		applyTheme(defaultTheme);

		displayThemeOutput(defaultTheme, outputContent);
		loadAndDisplayThemes();
	}

	initializeApp();
});
