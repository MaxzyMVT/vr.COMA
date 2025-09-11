document.addEventListener("DOMContentLoaded", () => {
	// --- State ---
	let currentTheme = null;
	let savedThemesCache = [];
	let themeIdToEdit = null;
	let colorKeyToEdit = null;

	// Defualt theme to apply on initial load
	const defaultTheme = {
		themeName: "Default Neutral",
		advice:
			"This is a balanced, neutral theme perfect for professional portfolios, blogs, or business applications. It prioritizes readability and provides a clean, modern starting point.",
		colors: {
			primaryBackground: "#2c3e50",
			canvasBackground: "#ecf0f1",
			primaryText: "#2c3e50",
			secondaryText: "#8j99a9",
			accent: "#3498db",
			interactiveBackground: "#3498db",
			interactiveText: "#ffffff",
			surfaceBackground: "#ffffff",
			outlineSeparators: "#bdc3c7",
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

	// --- Modals ---

	const editModal = document.getElementById("edit-modal");
	const modalInputName = document.getElementById("modal-input-name");
	const modalSaveBtn = document.getElementById("modal-save-btn");
	const modalCancelBtn = document.getElementById("modal-cancel-btn");
	const colorEditModal = document.getElementById("color-edit-modal");
	const modalColorPicker = document.getElementById("modal-color-picker");
	const modalColorHex = document.getElementById("modal-color-hex");
	const modalCopyBtn = document.getElementById("modal-copy-btn");
	const modalColorCloseBtn = document.getElementById("modal-color-close-btn");

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
		const fullPrompt = `Based on the previously generated theme named "${
			currentTheme.themeName
		}" which has this JSON data: ${JSON.stringify(
			currentTheme
		)}, please revise it with this new instruction: "${revisionPrompt}"`;

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

	async function handleSaveChanges() {
		const newName = modalInputName.value.trim();
		if (!newName || !themeIdToEdit) return;

		try {
			await apiUpdateTheme(themeIdToEdit, { themeName: newName });
			hideEditModal();
			await loadAndDisplayThemes();
		} catch (error) {
			console.error(error);
			alert(error.message);
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
		// Handle inline edit button
		const editNameBtn = event.target.closest(".edit-theme-name-btn");
		if (editNameBtn) {
			const newName = prompt(
				"Enter a new name for the current theme:",
				currentTheme.themeName
			);
			if (newName && newName.trim() !== "") {
				currentTheme.themeName = newName.trim();
				// Re-render the UI to show the new name instantly
				applyTheme(currentTheme, previewThemeName);
				displayThemeOutput(currentTheme, outputContent);
			}
		}
		// Handle color chip click
		const colorChip = event.target.closest(".color-chip");
		if (colorChip) {
			colorKeyToEdit = colorChip.dataset.key; // Store which color we're editing
			const currentColor = currentTheme.colors[colorKeyToEdit];
			showColorEditorModal(colorKeyToEdit, currentColor);
		}
	});

	savedThemesList.addEventListener("click", (event) => {
		const loadBtn = event.target.closest(".load-btn");
		if (loadBtn) {
			const themeToLoad = savedThemesCache.find(
				(t) => t._id === loadBtn.dataset.id
			);
			if (themeToLoad) {
				currentTheme = themeToLoad;
				applyTheme(themeToLoad, previewThemeName);
				displayThemeOutput(themeToLoad, outputContent);
				reviseButton.disabled = false;
			}
			return;
		}

		const editBtn = event.target.closest(".edit-btn");
		if (editBtn) {
			const themeToEdit = savedThemesCache.find(
				(t) => t._id === editBtn.dataset.id
			);
			if (themeToEdit) {
				themeIdToEdit = themeToEdit._id; // Set the ID to edit
				// console.log("Editing theme:", themeToEdit);
				showEditModal(themeToEdit); // Call UI function
			}
			return;
		}

		const deleteBtn = event.target.closest(".delete-btn");
		if (deleteBtn) {
			handleDeleteTheme(deleteBtn.dataset.id);
			return;
		}
	});

	titleHeader.addEventListener("click", () => {
		console.log("Restoring default theme.");
		currentTheme = defaultTheme;
		textInput.value = ""; // Clear the text area
		applyTheme(defaultTheme, previewThemeName);
		displayThemeOutput(defaultTheme, outputContent);
	});

	modalColorPicker.addEventListener("input", () => {
		const newColor = modalColorPicker.value;
		modalColorHex.value = newColor;

		// Update the current theme object IN REAL TIME
		currentTheme.colors[colorKeyToEdit] = newColor;
		// Re-apply the entire theme to see the change live
		applyTheme(currentTheme, previewThemeName);
	});

	modalColorHex.addEventListener("input", () => {
		const newColor = modalColorHex.value;
		// Basic validation for hex color
		if (/^#[0-9A-F]{6}$/i.test(newColor)) {
			modalColorPicker.value = newColor;
			currentTheme.colors[colorKeyToEdit] = newColor;
			applyTheme(currentTheme, previewThemeName);
		}
	});

	modalCopyBtn.addEventListener("click", () => {
		copyToClipboard(modalColorHex.value);
	});

	modalColorCloseBtn.addEventListener("click", () => {
		// When we close, we also need to re-render the output to reflect any changes
		displayThemeOutput(currentTheme, outputContent);
		hideColorEditorModal();
	});

	modalSaveBtn.addEventListener("click", handleSaveChanges);
	modalCancelBtn.addEventListener("click", hideEditModal);

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
		applyTheme(defaultTheme, previewThemeName);
		displayThemeOutput(defaultTheme, outputContent);
		loadAndDisplayThemes();
	}

	initializeApp(); // Run the initialization
});
