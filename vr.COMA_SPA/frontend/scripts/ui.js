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
	// Use Object.entries to loop through the received colors
	for (const [key, color] of Object.entries(theme.colors)) {
		// Look up the friendly name, or use the key as a fallback
		const displayName = friendlyNames[key] || key;

		colorChipsHTML += `
            <div class="color-chip" title="Click to copy" onclick="copyToClipboard('${color}')">
                <div class="color-swatch" style="background-color: ${color};"></div>
                <div class="color-info">
                    <span class="color-name">${displayName}</span>
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
}

function displaySavedThemes(themes) {
	// This function's only job is to update the UI.
	const savedThemesList = document.getElementById("saved-themes-list");

	savedThemesList.innerHTML = ""; // Clear current list

	if (!themes || themes.length === 0) {
		savedThemesList.innerHTML = "<p>No saved themes yet.</p>";
		return;
	}

	themes.forEach((theme) => {
		const themeItem = document.createElement("div");
		themeItem.className = "saved-theme-item";

		themeItem.innerHTML = `
            <span>${theme.themeName}</span>
            <div>
                <button class="load-btn" data-id="${theme._id}">Load</button>
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
