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
		"--secondary-header-bg": theme.colors.secondaryHeader,
		"--header-text": theme.colors.headerText,
		"--sub-header-text": theme.colors.subHeaderText,
		"--main-bg": theme.colors.canvasBackground,
		"--container-bg": theme.colors.surfaceBackground,
		"--primary-text": theme.colors.primaryText,
		"--secondary-text": theme.colors.secondaryText,
		"--accent": theme.colors.accent,
		"--border-color": theme.colors.outlineSeparators,
		"--btn-bg": theme.colors.primaryInteractive,
		"--btn-text": theme.colors.primaryInteractiveText,
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
        <button id="save-theme-button" class="spaced-button">Save Theme</button>
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
		themeItem.className = "saved-theme-item load-btn";
		themeItem.dataset.id = theme._id;

		const keyColors = [
			"primaryHeader",
			"surfaceBackground",
			"primaryText",
			"accent",
		];

		let swatchesHTML = '<div class="theme-swatches">';
		keyColors.forEach((key) => {
			const color = theme.colors[key];
			if (color) {
				// Only add a swatch if the color exists
				swatchesHTML += `<div class="theme-swatch" style="background-color: ${color};"></div>`;
			}
		});
		swatchesHTML += "</div>";

		themeItem.innerHTML = `
            <div class="theme-info">
                <span>${theme.themeName}</span>
                ${swatchesHTML}
            </div>
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
                    <svg viewBox="0 0 24 24">
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

function initializeCharacterCounter() {
    const textInput = document.getElementById('text-input');
    const characterCounter = document.getElementById('character-counter');
    const warningMessage = document.getElementById('warning-message');
    
    function updateCharacterCounter() {
        const currentLength = textInput.value.length;
        const maxLength = 1000;
        
        // Update counter text
        characterCounter.textContent = `${currentLength}/${maxLength} characters`;
        
        // Update counter color based on usage
        if (currentLength >= maxLength) {
            characterCounter.classList.add('at-limit');
            warningMessage.style.display = 'block';
        } else if (currentLength >= maxLength * 0.9) { // 90% of limit
            characterCounter.classList.add('near-limit');
            characterCounter.classList.remove('at-limit');
            warningMessage.style.display = 'none';
        } else {
            characterCounter.classList.remove('near-limit', 'at-limit');
            warningMessage.style.display = 'none';
        }
    }
    
    // Add event listeners for real-time updates
    textInput.addEventListener('input', updateCharacterCounter);
    textInput.addEventListener('paste', function() {
        // Use setTimeout to ensure the pasted content is processed
        setTimeout(updateCharacterCounter, 0);
    });
    
    // Initialize counter on page load
    updateCharacterCounter();
}

// Call this function when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeCharacterCounter);
