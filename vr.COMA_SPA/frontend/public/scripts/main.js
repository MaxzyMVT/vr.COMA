document.addEventListener("DOMContentLoaded", () => {
	// --- State ---
	let currentTheme = null;
	let initialTheme = null; // The first theme generated or loaded for a group
	let invertedThemeCache = null; // Stores the AI-generated counterpart
	const themeCache = new Map(); // groupId -> { light, dark }
	let savedThemesCache = [];
	let colorKeyToEdit = null;
	let lastInnerWidth = null;
	let baseInnerWidth = null;

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
	const densityControls = document.querySelector(".density-controls");

	const interactiveElements = {
		generateButton,
		reviseButton,
		uiModeToggle,
		textInput,
		outputContent,
		savedThemesList,
		titleHeader,
		searchInput,
	};

	// --- Modals ---
	const modalColorPicker = document.getElementById("modal-color-picker");
	const modalColorHex = document.getElementById("modal-color-hex");
	const modalCopyBtn = document.getElementById("modal-copy-btn");
	const modalColorCloseBtn = document.getElementById("modal-color-close-btn");
	const modalColorCancelBtn = document.getElementById("modal-color-cancel-btn");

	// ---text exceeded warning elements ---
	const warningMessage = document.getElementById("warning-message");
	const maxLength = 1000;
	textInput.addEventListener("input", () => {
		if (textInput.value.length > maxLength) {
			textInput.value = textInput.value.slice(0, maxLength);
		}

		// Show or hide warning
		if (textInput.value.length === maxLength) {
			warningMessage.style.display = "block";
		} else {
			warningMessage.style.display = "none";
		}
	});

	// --- Event Handlers ---
	async function handleGenerateTheme() {
		setUIInteractive(false, interactiveElements);
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
		} catch (error) {
			console.error(error);
			alert("Could not generate the theme. Please try again.");
		} finally {
			setUIInteractive(true, interactiveElements);
		}
	}

	async function handleSaveTheme() {
		if (!currentTheme) {
			alert("No theme has been generated yet.");
			return;
		}

		const { _id, ...payload } = currentTheme;

		const existingTheme = savedThemesCache.find(
			(t) => t.themeName === payload.themeName
		);

		if (existingTheme) {
			if (
				confirm(
					`A theme named "${payload.themeName}" already exists. Do you want to overwrite it?`
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
			await apiSaveTheme(payload);
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
			savedThemesList.innerHTML = `
            <div class="message-box warning">
                <p class="warning-text">Could not load saved themes.</p>
            </div>`;
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

		setUIInteractive(false, interactiveElements);
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
			setUIInteractive(true, interactiveElements);
		}
	}

	function autoGrowTextarea(element) {
		element.style.height = "auto"; // Reset height to recalculate
		element.style.height = element.scrollHeight + "px"; // Set to content height
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

	function checkZoomAndToggleDensityButtons() {
		// Don't run if the baseline hasn't been set yet.
		if (!baseInnerWidth) return;

		const currentWidth = window.innerWidth;
		// Calculate scale relative to the user's starting window size.
		const currentScale = currentWidth / baseInnerWidth;

		// --- Define visibility based on the adaptive scale ---
		// A scale of 1.2 roughly corresponds to a 80% zoom level
		const canShow3x = currentScale >= 1.2;
		// A scale of 1.6 roughly corresponds to a 50% zoom level
		const canShow5x = currentScale >= 1.6;

		// --- NEW LOGIC: Hide the bar if only 1x is available ---
		if (!canShow3x && !canShow5x) {
			densityControls.style.display = "none";
			// Ensure layout is reset to 1x if controls are hidden
			const btn1x = densityControls.querySelector('[data-density="1"]');
			if (btn1x && !btn1x.classList.contains("active")) {
				btn1x.click();
			}
			return; // Exit the function after hiding the bar
		}

		// If we reach this point, the bar should be visible.
		densityControls.style.display = "flex";

		const btn3x = densityControls.querySelector('[data-density="3"]');
		const btn5x = densityControls.querySelector('[data-density="5"]');
		if (!btn3x || !btn5x) return;

		// Set individual button visibility
		btn3x.style.display = canShow3x ? "" : "none";
		btn5x.style.display = canShow5x ? "" : "none";

		// --- The Auto-Adjustment logic remains the same ---
		const activeBtn = densityControls.querySelector("button.active");
		if (!activeBtn) return;

		const activeDensity = parseInt(activeBtn.dataset.density, 10);

		if (canShow5x && activeDensity < 5) {
			btn5x.click();
		} else if (canShow3x && activeDensity < 3) {
			btn3x.click();
		} else if (!canShow5x && activeDensity === 5) {
			if (canShow3x) {
				btn3x.click();
			} else {
				densityControls.querySelector('[data-density="1"]').click();
			}
		} else if (!canShow3x && activeDensity === 3) {
			densityControls.querySelector('[data-density="1"]').click();
		}
	}

	function watchViewport() {
		const currentWidth = window.innerWidth;
		// Only run the logic if the width has actually changed.
		if (currentWidth !== lastInnerWidth) {
			checkZoomAndToggleDensityButtons();
			lastInnerWidth = currentWidth;
		}
		requestAnimationFrame(watchViewport); // Continue the loop
	}

	// --- Event Listeners ---
	generateButton.addEventListener("click", handleGenerateTheme);
	reviseButton.addEventListener("click", handleReviseTheme);
	searchInput.addEventListener("input", handleSearch);

	densityControls.addEventListener("click", (e) => {
		const button = e.target.closest("button");
		if (button) {
			const density = button.dataset.density;
			savedThemesList.dataset.density = density;

			// Update the active button state
			densityControls.querySelector("button.active").classList.remove("active");
			button.classList.add("active");
		}
	});

	// --- REWRITTEN: Event listener for AI-powered theme inversion ---
	uiModeToggle.addEventListener("click", async () => {
		if (!currentTheme) return;

		setUIInteractive(false, interactiveElements);

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
			setUIInteractive(true, interactiveElements);
		}
	});

	outputSection.addEventListener("click", (event) => {
		if (event.target.id === "save-theme-button") {
			handleSaveTheme();
		}

		// Edit theme name button
		const editNameBtn = event.target.closest(".edit-theme-name-btn");
		if (editNameBtn) {
			const h3 = document.getElementById("current-theme-name");
			const header = h3.parentElement;
			const input = document.createElement("input");
			input.type = "text";
			input.value = currentTheme.themeName;
			input.className = "theme-name-input";
			input.maxLength = 30;

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

		// --- UPDATED: Edit/Add theme description button ---
		const editAdviceBtn = event.target.closest(
			".edit-theme-advice-btn, .inline-edit-advice-btn, .add-advice-btn"
		);
		if (editAdviceBtn) {
			// Get the parent container directly. This works for both the icon and the full-width button.
			const container = editAdviceBtn.parentElement;

			const editorWrapper = document.createElement("div");
			editorWrapper.className = "advice-editor-wrapper";

			const textarea = document.createElement("textarea");
			// Use currentTheme.advice, which will be empty if the "add" button was clicked.
			textarea.value = currentTheme.advice || "";
			textarea.className = "advice-textarea-input";
			textarea.maxLength = 800;

			const counterContainer = document.createElement("div");
			counterContainer.className = "character-counter-container";

			const counter = document.createElement("span");
			counter.className = "character-counter";

			const maxLengthAdvice = 800;

			textarea.addEventListener("input", () => autoGrowTextarea(textarea));
			setTimeout(() => autoGrowTextarea(textarea), 0); // Set initial size

			function updateAdviceCounter() {
				const currentLength = textarea.value.length;
				counter.textContent = `${currentLength}/${maxLengthAdvice}`;

				counter.classList.remove("near-limit", "at-limit");
				if (currentLength >= maxLengthAdvice) {
					counter.classList.add("at-limit");
				} else if (currentLength >= maxLengthAdvice * 0.9) {
					counter.classList.add("near-limit");
				}
			}

			textarea.addEventListener("input", updateAdviceCounter);

			const saveAndExitEditMode = () => {
				currentTheme.advice = textarea.value.trim();
				displayThemeOutput(currentTheme, outputContent);
			};

			textarea.addEventListener("blur", saveAndExitEditMode);
			textarea.addEventListener("keydown", (e) => {
				if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
					saveAndExitEditMode();
				} else if (e.key === "Escape") {
					displayThemeOutput(currentTheme, outputContent);
				}
			});

			counterContainer.appendChild(counter);
			editorWrapper.appendChild(textarea);
			editorWrapper.appendChild(counterContainer);

			// Replace the button (or text+button) with the editor
			container.innerHTML = "";
			container.appendChild(editorWrapper);

			updateAdviceCounter(); // Initialize counter
			textarea.focus();
		}

		// Color Chips
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
				currentTheme = currentTheme = JSON.parse(JSON.stringify(themeToLoad));
				applyTheme(themeToLoad);
				displayThemeOutput(themeToLoad, outputContent);
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

		textInput.addEventListener("input", () => autoGrowTextarea(textInput));
		autoGrowTextarea(textInput); // Set initial size correctly on load

		baseInnerWidth = window.innerWidth;

		lastInnerWidth = window.innerWidth; // Set initial value

		// Recalibrate the base width after orientation changes to prevent false zoom detection.
		window.addEventListener("orientationchange", () => {
			// A short delay allows the browser to report the correct new width.
			setTimeout(() => {
				baseInnerWidth = window.innerWidth;
				lastInnerWidth = window.innerWidth; // Also reset the last known width
				checkZoomAndToggleDensityButtons(); // Re-run the check immediately
			}, 100);
		});

		checkZoomAndToggleDensityButtons(); // Run once on load
		requestAnimationFrame(watchViewport);
	}

	initializeApp();
});
