// File: r.COMA/frontend/scripts/ui.js

function applyTheme(theme, previewThemeName) {
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

	if (previewThemeName) {
		previewThemeName.textContent = theme.themeName;
	}
}

function displayThemeOutput(theme, outputContent) {
	if (!outputContent) return;

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
