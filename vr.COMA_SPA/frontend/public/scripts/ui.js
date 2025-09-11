function applyTheme(theme, previewThemeName) {
	if (!theme || !theme.colors) return;
	const root = document.documentElement;
	// Map colors from themeData to CSS variables
	const colorMap = {
		"--header-bg": theme.colors.primaryBackground,
		"--main-bg": theme.colors.canvasBackground,
		"--primary-text": theme.colors.primaryText,
		"--secondary-text": theme.colors.secondaryText,
		"--accent": theme.colors.accent,
		"--btn-bg": theme.colors.interactiveBackground,
		"--btn-text": theme.colors.interactiveText,
		"--container-bg": theme.colors.surfaceBackground,
		"--border-color": theme.colors.outlineSeparators,
	};

	for (const [variable, color] of Object.entries(colorMap)) {
		if (color) {
			// Safety check in case a color is missing
			root.style.setProperty(variable, color);
		}
	}

	if (previewThemeName) {
		previewThemeName.textContent = theme.themeName;
	}
}

function displayThemeOutput(theme, outputContent) {
	if (!outputContent) return;

	// This is a mapping from the JSON key to the display name
	const friendlyNames = {
		primaryBackground: "Primary Background",
		canvasBackground: "Canvas Background",
		primaryText: "Primary Text",
		secondaryText: "Secondary Text",
		accent: "Accent / Highlight",
		interactiveBackground: "Interactive Background",
		interactiveText: "Interactive Text",
		surfaceBackground: "Surface Background",
		outlineSeparators: "Outline & Separators",
	};

	let colorChipsHTML = "";
	for (const [key, color] of Object.entries(theme.colors)) {
		const displayName = friendlyNames[key] || key;
		// Add data-key attribute to identify which color was clicked
		colorChipsHTML += `
            <div class="color-chip" data-key="${key}" title="Edit ${displayName}">
                <div class="color-swatch" style="background-color: ${color};"></div>
                <div class="color-info">
                    <span class="color-name">${displayName}</span>
                    <span>${color}</span>
                </div>
            </div>`;
	}

	outputContent.innerHTML = `
        <div class="theme-name-header">
            <h3 id="current-theme-name">${theme.themeName}</h3>
            <button class="icon-btn edit-theme-name-btn" title="Edit Name">
                <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
        </div>
        <p>${theme.advice}</p>
        <div class="color-palette">${colorChipsHTML}</div>
        <button id="save-theme-button">Save Theme</button>
    `;
}

function displaySavedThemes(themes) {
	const savedThemesList = document.getElementById("saved-themes-list");
	savedThemesList.innerHTML = "";
	if (!themes || themes.length === 0) {
		savedThemesList.innerHTML = "<p>No saved themes yet.</p>";
		return;
	}
	themes.forEach((theme) => {
		const themeItem = document.createElement("div");
		themeItem.className = "saved-theme-item";
		themeItem.innerHTML = `
            <span>${theme.themeName}</span>
            <div class="saved-theme-actions">
                <button class="load-btn" data-id="${theme._id}">Load</button>
                <button class="icon-btn edit-btn" data-id="${theme._id}" title="Edit Name">
                    <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </button>
                <button class="delete-btn" data-id="${theme._id}">Delete</button>
            </div>`;
		savedThemesList.appendChild(themeItem);
	});
}

function setLoadingState(isLoading, generateButton, reviseButton) {
	if (generateButton) {
		generateButton.disabled = isLoading;
		generateButton.textContent = isLoading ? "Generating..." : "Generate";
	}

	if (reviseButton) {
		// We will add more complex logic for this later. For now, just disable it.
		reviseButton.disabled = isLoading;
	}
}

function showColorEditorModal(colorKey, colorValue) {
	const modal = document.getElementById("color-edit-modal");
	const nameLabel = document.getElementById("modal-color-name");
	const colorPicker = document.getElementById("modal-color-picker");
	const hexInput = document.getElementById("modal-color-hex");

	const friendlyName = colorKey.replace(/([A-Z])/g, " $1").trim();
	nameLabel.textContent = `Edit ${friendlyName}`;
	colorPicker.value = colorValue;
	hexInput.value = colorValue;

	modal.classList.remove("hidden");
}

function hideColorEditorModal() {
	const modal = document.getElementById("color-edit-modal");
	modal.classList.add("hidden");
}

function showEditModal(theme) {
	console.log("Showing edit modal for theme:", theme);
	const editModal = document.getElementById("edit-modal");
	const modalInputName = document.getElementById("modal-input-name");

	modalInputName.value = theme.themeName; // Pre-fill the input
	editModal.classList.remove("hidden");
}

function hideEditModal() {
	const editModal = document.getElementById("edit-modal");
	editModal.classList.add("hidden");
}
