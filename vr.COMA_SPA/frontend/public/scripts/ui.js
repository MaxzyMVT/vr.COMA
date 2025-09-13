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

/**
 * The single, consolidated function to apply a theme to the entire document.
 * It sets CSS variables, updates the preview card, and sets the UI mode icon.
 */
function applyTheme(theme) {
	if (!theme || !theme.colors) return;
	const root = document.documentElement;

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
			root.style.setProperty(variable, color);
		}
	}

	// Update the preview card specifically
	const previewThemeName = document.getElementById("preview-theme-name");
	const previewSubHeader = document.getElementById("preview-sub-header");

	if (previewThemeName) {
		previewThemeName.textContent = theme.themeName;
	}
	if (previewSubHeader) {
		previewSubHeader.style.color = theme.colors.subHeaderText;
	}

	// Update the UI mode icon (sun/moon)
	setUiIcon(!!theme.isDark);
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
		reviseButton.disabled = isLoading;
	}
}

function showColorEditorModal(colorKey, colorValue) {
	const modal = document.getElementById("color-edit-modal");
	const nameLabel = document.getElementById("modal-color-name");
	const colorPicker = document.getElementById("modal-color-picker");
	const hexInput = document.getElementById("modal-color-hex");

	const displayName = friendlyNames[colorKey] || key;
	nameLabel.textContent = `Edit ${displayName}`;

	colorPicker.value = colorValue;
	hexInput.value = colorValue;

	modal.classList.remove("hidden");
}

function hideColorEditorModal() {
	const modal = document.getElementById("color-edit-modal");
	modal.classList.add("hidden");
}

// --- Theme Inversion Logic ---
function hexToHsl(hex) {
	const x = hex.replace("#", "");
	const n = parseInt(x, 16);
	const r = ((n >> 16) & 255) / 255,
		g = ((n >> 8) & 255) / 255,
		b = (n & 255) / 255;
	const max = Math.max(r, g, b),
		min = Math.min(r, g, b);
	let h,
		s,
		l = (max + min) / 2;
	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0);
				break;
			case g:
				h = (b - r) / d + 2;
				break;
			case b:
				h = (r - g) / d + 4;
				break;
		}
		h /= 6;
	}
	return { h, s, l };
}

function hslToHex(h, s, l) {
	const hue2rgb = (p, q, t) => {
		if (t < 0) t += 1;
		if (t > 1) t -= 1;
		if (t < 1 / 6) return p + (q - p) * 6 * t;
		if (t < 1 / 2) return q;
		if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
		return p;
	};
	let r, g, b;
	if (s === 0) {
		r = g = b = l;
	} else {
		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}
	const toHex = (v) =>
		Math.round(v * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Dummy ensureContrast function if it's not defined elsewhere
// This is a placeholder; your actual implementation might be more complex
function ensureContrast(fg, bg, ratio) {
	const bgLightness = hexToHsl(bg).l;
	const fgLightness = hexToHsl(fg).l;
	if (bgLightness > 0.5) {
		// Light background
		return fgLightness > 0.4 ? "#111111" : fg; // Darken light text
	} else {
		// Dark background
		return fgLightness < 0.6 ? "#EEEEEE" : fg; // Lighten dark text
	}
}

// Expose to global scope for main.js
window.hexToHsl = hexToHsl;

function setUiIcon(isDark) {
	const svg = document.getElementById("ui-mode-icon");
	const button = document.getElementById("ui-mode-toggle");
	if (!svg || !button) return;

	if (isDark) {
		svg.innerHTML =
			'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
		button.title = "Switch to Light Mode";
	} else {
		svg.innerHTML =
			'<circle cx="12" cy="12" r="5"></circle><g stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="4"></line><line x1="12" y1="20" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="6.34" y2="6.34"></line><line x1="17.66" y1="17.66" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="4" y2="12"></line><line x1="20" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="6.34" y2="17.66"></line><line x1="17.66" y1="6.34" x2="19.78" y2="4.22"></line></g>';
		button.title = "Switch to Dark Mode";
	}
}
