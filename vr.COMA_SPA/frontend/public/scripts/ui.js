// This is a mapping from the JSON key to the display name
const friendlyNames = {
	primaryHeader: "Primary Header",
	secondaryHeader: "Secondary Header",
	headerText: "Header Text",
	subHeaderText: "Sub-Header Text",
	canvasBackground: "Canvas Background",
	surfaceBackground: "Surface Background",
	primaryText: "Primary Text",
	secondaryText: "Secondary Text",
	accent: "Accent / Highlight",
	outlineSeparators: "Outline & Separators",
	primaryInteractive: "Primary Interactive",
	primaryInteractiveText: "Primary Interactive Text",
	secondaryInteractive: "Secondary Interactive",
	secondaryInteractiveText: "Secondary Interactive Text",
};

function applyTheme(theme, previewThemeName, previewSubHeader) {
	if (!theme || !theme.colors) return;
	const root = document.documentElement;
	// Map colors from themeData to CSS variables
	const colorMap = {
		"--header-bg": theme.colors.primaryHeader,
		"--header-text": theme.colors.headerText,
		"--sub-header-text": theme.colors.subHeaderText,
		"--main-bg": theme.colors.canvasBackground,
		"--primary-text": theme.colors.primaryText,
		"--secondary-text": theme.colors.secondaryText,
		"--accent": theme.colors.accent,
		"--btn-bg": theme.colors.primaryInteractive,
		"--btn-text": theme.colors.primaryInteractiveText,
		"--container-bg": theme.colors.surfaceBackground,
		"--border-color": theme.colors.outlineSeparators,
		"--secondary-interactive-bg": theme.colors.secondaryInteractive,
		"--secondary-interactive-text": theme.colors.secondaryInteractiveText,
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

	if (previewSubHeader) {
		previewSubHeader.style.color = theme.colors.subHeaderText;
	}
}

function displayThemeOutput(theme, outputContent) {
	if (!outputContent) return;

	// The exact order that the colors will appear in.
	const displayOrder = [
		"primaryHeader",
		"secondaryHeader",
		"headerText",
		"subHeaderText",
		"canvasBackground",
		"surfaceBackground",
		"primaryText",
		"secondaryText",
		"accent",
		"outlineSeparators",
		"primaryInteractive",
		"primaryInteractiveText",
		"secondaryInteractive",
		"secondaryInteractiveText",
	];

	let colorChipsHTML = "";
	displayOrder.forEach((key) => {
		const color = theme.colors[key];
		if (color) {
			// Only display if the color exists in the theme data
			const displayName = friendlyNames[key] || key;
			colorChipsHTML += `
                <div class="color-chip" data-key="${key}" title="Edit ${displayName}">
                    <div class="color-swatch" style="background-color: ${color};"></div>
                    <div class="color-info">
                        <span class="color-name">${displayName}</span>
                        <span>${color}</span>
                    </div>
                </div>`;
		}
	});

	outputContent.innerHTML = `
        <div class="theme-name-header">
            <h3 id="current-theme-name">${theme.themeName}</h3>
            <button class="icon-btn edit-theme-name-btn" title="Edit Name">
                <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
        </div>
        <p>${theme.advice}</p>
        <div class="color-palette">${colorChipsHTML}</div>
        <button id="save-theme-button"  class="spaced-button" >Save Theme</button>
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
		// --- THIS IS THE CHANGE: We are creating a <div> again ---
		const themeItem = document.createElement("div");

		// We still assign both classes. 'load-btn' is our hook for JavaScript.
		themeItem.className = "saved-theme-item load-btn";
		themeItem.dataset.id = theme._id; // The ID is still on the main element

        themeItem.innerHTML = `
            <span>${theme.themeName}</span>
            <div class="saved-theme-actions">
                <button class="icon-btn save-btn" data-id="${theme._id}" title="Overwrite with current theme">
					<svg viewBox="0 0 24 24">
                        <path d="M22.5,22.5H1.5V1.5H18.68L22.5,5.32Z"></path>
                        <path d="M7.23,1.5h9.55a0,0,0,0,1,0,0V6.27a1,1,0,0,1-1,1H8.18a1,1,0,0,1-1-1V1.5A0,0,0,0,1,7.23,1.5Z"></path>
                        <rect x="6.27" y="14.86" width="11.45" height="7.64"></rect>
                        <line x1="9.14" y1="18.68" x2="14.86" y2="18.68"></line>
                    </svg>
                </button>
                <button class="icon-btn delete-btn" data-id="${theme._id}" title="Delete Theme">
                    <svg viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6L6 18"></path>
                        <path d="M6 6l12 12"></path>
                    </svg>
                </button>
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

	const displayName = friendlyNames[colorKey] || colorKey;
	nameLabel.textContent = `Edit ${displayName}`;

	colorPicker.value = colorValue;
	hexInput.value = colorValue;

	modal.classList.remove("hidden");
}

function hideColorEditorModal() {
	const modal = document.getElementById("color-edit-modal");
	modal.classList.add("hidden");
}
