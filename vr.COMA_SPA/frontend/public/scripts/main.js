document.addEventListener("DOMContentLoaded", () => {
	// --- State ---
	let currentTheme = null;
	let savedThemesCache = [];
	let themeIdToEdit = null;
	let colorKeyToEdit = null;
	let originalColorBeforeEdit = null;

	// Defualt theme to apply on initial load
	const defaultTheme = {
		themeName: "Default Neutral",
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
	const savedThemesList = document.getElementById("saved-themes-list");
	const generateButton = document.getElementById("generate-button");
	const reviseButton = document.getElementById("revise-button");
	const outputSection = document.getElementById("output-section");
	const previewThemeName = document.getElementById("preview-theme-name");
	const previewSubHeader = document.getElementById("preview-sub-header");
	const outputContent = document.getElementById("output-content");

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
			const themeData = await apiGenerateTheme(prompt); // Call API function
			currentTheme = themeData;
			applyTheme(themeData, previewThemeName, previewSubHeader); // Call UI function
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
		const fullPrompt = `Based on the previously generated theme named "${
			currentTheme.themeName
		}", which has this JSON data: ${JSON.stringify(
			currentTheme
		)}, please revise and improve it with this new instruction: "${revisionPrompt}"`;

		// 3. The rest is very similar to handleGenerateTheme
		setLoadingState(true, generateButton, reviseButton);
		try {
			// We can reuse the same API function!
			const themeData = await apiGenerateTheme(fullPrompt);

			currentTheme = themeData; // Update the state
			applyTheme(themeData, previewThemeName, previewSubHeader);
			displayThemeOutput(themeData, outputContent);
		} catch (error) {
			console.error("Revision Error:", error);
			alert("There was an error revising the theme. Please try again.");
		} finally {
			setLoadingState(false, generateButton, reviseButton);
		}
	}

	async function handleOverwriteTheme(themeId) {
        if (!currentTheme) {
            alert("Please generate or revise a theme first before trying to overwrite another.");
            return;
        }
        const themeToOverwrite = savedThemesCache.find(t => t._id === themeId);
        if (!themeToOverwrite) return;

        if (confirm(`Are you sure you want to overwrite "${themeToOverwrite.themeName}" with the currently generated theme? This cannot be undone.`)) {
            try {
                // We send the entire current theme object to the backend for replacement.
                await apiOverwriteTheme(themeId, currentTheme);
                alert(`Successfully updated "${themeToOverwrite.themeName}"!`);
                await loadAndDisplayThemes(); // Refresh the list
            } catch (error) {
                console.error("Error overwriting theme:", error);
                alert("Could not update the theme. Please try again.");
            }
        }
    }

	// --- Event Listeners ---
	generateButton.addEventListener("click", handleGenerateTheme);
	reviseButton.addEventListener("click", handleReviseTheme);

	outputSection.addEventListener("click", (event) => {
		// Handle Save button
		if (event.target.id === "save-theme-button") {
			handleSaveTheme();
		}
		// Handle INLINE EDIT button
		const editNameBtn = event.target.closest(".edit-theme-name-btn");
		if (editNameBtn) {
			const h3 = document.getElementById("current-theme-name");
			const header = h3.parentElement;

			const input = document.createElement("input");
			input.type = "text";
			input.value = currentTheme.themeName;
			input.className = "theme-name-input";

			// Function to save changes and switch back to h3
			const saveAndExitEditMode = () => {
				const newName = input.value.trim();
				if (newName) {
					currentTheme.themeName = newName;
					// Re-render the entire output to restore the h3 and button
					displayThemeOutput(currentTheme, outputContent);
					// Also update the preview panel's name
					applyTheme(themeData, previewThemeName, previewSubHeader);
				} else {
					// If name is empty, just revert
					displayThemeOutput(currentTheme, outputContent);
				}
			};

			input.addEventListener("blur", saveAndExitEditMode);
			input.addEventListener("keydown", (e) => {
				if (e.key === "Enter") {
					saveAndExitEditMode();
				} else if (e.key === "Escape") {
					// On escape, just revert without saving
					displayThemeOutput(currentTheme, outputContent);
				}
			});

			header.innerHTML = ""; // Clear the header
			header.appendChild(input);
			input.focus(); // Focus the input for immediate typing
		}
		// Handle color chip click
		const colorChip = event.target.closest(".color-chip");
		if (colorChip) {
			colorKeyToEdit = colorChip.dataset.key;
			const currentColor = currentTheme.colors[colorKeyToEdit];
			originalColorBeforeEdit = currentColor; // <-- Store original color
			showColorEditorModal(colorKeyToEdit, currentColor);
		}
	});

	savedThemesList.addEventListener("click", (event) => {
    // Check for the most specific buttons first (the icons)
		const editBtn = event.target.closest('.edit-btn');
		const saveBtn = event.target.closest('.save-btn');
        if (saveBtn) {
            event.stopPropagation();
            handleOverwriteTheme(saveBtn.dataset.id);
            return;
        }

		const deleteBtn = event.target.closest(".delete-btn");
		if (deleteBtn) {
			event.stopPropagation(); // Stop the click from bubbling to the parent div
			const themeId = deleteBtn.dataset.id;
			handleDeleteTheme(themeId);
			return;
		}

		// If not an icon, check if the click was on the main item
		const loadBtn = event.target.closest(".load-btn");
		if (loadBtn) {
			const themeId = loadBtn.dataset.id;
			const themeToLoad = savedThemesCache.find((t) => t._id === themeId);
			if (themeToLoad) {
				currentTheme = themeToLoad;
				applyTheme(themeToLoad, previewThemeName, previewSubHeader);
				displayThemeOutput(themeToLoad, outputContent);
				reviseButton.disabled = false;
			}
		}
	});

	titleHeader.addEventListener("click", () => {
		console.log("Restoring default theme.");
		currentTheme = defaultTheme;
		textInput.value = ""; // Clear the text area
		applyTheme(defaultTheme, previewThemeName, previewSubHeader);
		displayThemeOutput(defaultTheme, outputContent);
	});

	modalColorPicker.addEventListener("input", () => {
		const newColor = modalColorPicker.value;
		modalColorHex.value = newColor;

		// Update the current theme object IN REAL TIME
		currentTheme.colors[colorKeyToEdit] = newColor;
		// Re-apply the entire theme to see the change live
		applyTheme(currentTheme, previewThemeName, previewSubHeader);
	});

	modalColorHex.addEventListener("input", () => {
		const newColor = modalColorHex.value;
		// Basic validation for hex color
		if (/^#[0-9A-F]{6}$/i.test(newColor)) {
			modalColorPicker.value = newColor;
			currentTheme.colors[colorKeyToEdit] = newColor;
			applyTheme(currentTheme, previewThemeName, previewSubHeader);
		}
	});

	modalCopyBtn.addEventListener("click", () => {
		copyToClipboard(modalColorHex.value);
	});

	modalColorCancelBtn.addEventListener("click", () => {
		currentTheme.colors[colorKeyToEdit] = originalColorBeforeEdit;
		applyTheme(themeData, previewThemeName, previewSubHeader);
		displayThemeOutput(currentTheme, outputContent);
		hideColorEditorModal();
	});

	modalColorCloseBtn.addEventListener("click", () => {
		// When we close, we also need to re-render the output to reflect any changes
		displayThemeOutput(currentTheme, outputContent);
		hideColorEditorModal();
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
		currentTheme = defaultTheme;
		applyTheme(defaultTheme, previewThemeName, previewSubHeader);
		displayThemeOutput(defaultTheme, outputContent);
		loadAndDisplayThemes();
	}

	initializeApp(); // Run the initialization
});
