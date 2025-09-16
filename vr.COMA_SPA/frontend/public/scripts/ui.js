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

function hexToRgba(hex, alpha) {
	if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex; // Return if not a valid hex
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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

	// --- FINAL: Generate warning colors with a targeted "edge case" check ---
	const accentColor = theme.colors.accent;
	const containerBgColor = theme.colors.surfaceBackground;

	if (accentColor && containerBgColor) {
		// 1. Always calculate the DEFAULT colors based on the theme's accent first.
		const { s: accentSat, l: accentLight } = hexToHsl(accentColor);
		const defaultSaturation = Math.max(0.75, accentSat);
		const defaultLightness = accentLight > 0.75 ? 0.6 : accentLight < 0.25 ? 0.5 : accentLight;

		let warningColor = hslToHex(0.11, defaultSaturation, defaultLightness); // Default Yellow/Orange
		let limitColor = hslToHex(0, defaultSaturation, defaultLightness);     // Default Red

		// 2. Check if the BACKGROUND COLOR is the specific edge case.
		const { s: bgSat, l: bgLight } = hexToHsl(containerBgColor);

		// An "edge case" is a background that is both highly saturated and has mid-range lightness,
		// which is known to clash with the default red/yellow text.
		const isProblematicBackground = bgLight > 0.4 && bgLight < 0.65 && bgSat > 0.5;

		// 3. ONLY apply the high-contrast fallback for these true edge cases.
		if (isProblematicBackground) {
			const fallbackLightness = bgLight < 0.6 ? 0.95 : 0.15; // Use very light/dark text
			const fallbackSaturation = Math.max(0.85, accentSat);

			warningColor = hslToHex(0.11, fallbackSaturation, fallbackLightness);
			limitColor = hslToHex(0, fallbackSaturation, fallbackLightness);
		}

		// 4. Apply the final, correct colors to the UI.
		root.style.setProperty("--warning-text-color", warningColor);
		root.style.setProperty("--limit-text-color", limitColor);
		root.style.setProperty("--limit-bg-color", hexToRgba(limitColor, 0.15));
		root.style.setProperty("--limit-border-color", hexToRgba(limitColor, 0.4));
	}
	// --- End of new logic ---

	// Update the preview card and UI icon as before
	const previewThemeName = document.getElementById("preview-theme-name");
	const previewSubHeader = document.getElementById("preview-sub-header");

	if (previewThemeName) {
		previewThemeName.textContent = theme.themeName;
	}
	if (previewSubHeader) {
		previewSubHeader.style.color = theme.colors.subHeaderText;
	}
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

	let adviceHTML = "";
	if (theme.advice && theme.advice.trim() !== "") {
		adviceHTML = `
    <div class="advice-container">
      <p class="theme-advice-text">${theme.advice}</p>
      <button class="icon-btn inline-edit-advice-btn" title="Edit Advice (inline)">
        <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      </button>
      <button class="icon-btn edit-theme-advice-btn" title="Edit Advice">
        <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      </button>
    </div>
  `;
	} else {
		adviceHTML = `
    <div class="advice-container">
      <button class="add-advice-btn" title="Add a description for this theme">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14m-7-7h14"></path>
        </svg>
        <span>Add description</span>
      </button>
    </div>
  `;
	}

	outputContent.innerHTML = `
		<div class="theme-name-header">
			<h3 id="current-theme-name">${theme.themeName}</h3>
			<button class="icon-btn edit-theme-name-btn" title="Edit Name">
				<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
			</button>
		</div>
		${adviceHTML}
		<div class="color-palette">${colorChipsHTML}</div>
		<button id="save-theme-button" class="spaced-button">Save Theme</button>
	`;

	// --- NEW: Post-render check for single vs. multi-line advice ---
	const adviceContainer = outputContent.querySelector(".advice-container");
	const adviceText = outputContent.querySelector(".theme-advice-text");

	if (adviceContainer && adviceText) {
		const cs = window.getComputedStyle(adviceText);
		const lineHeight = parseFloat(cs.lineHeight);
		const textRect = adviceText.getBoundingClientRect();
		const textHeight = textRect.height;

		// single vs multi
		if (textHeight > lineHeight + 1) {
			adviceContainer.classList.add("multi-line");
		} else {
			adviceContainer.classList.add("single-line");
		}

		// Width of the first rendered line:
		// create a Range spanning the first line and measure it
		const range = document.createRange();
		range.selectNodeContents(adviceText);

		// Heuristic: measure width of the first line using the container's inline size
		// by temporarily constraining range to the first client rect
		const rects = range.getClientRects();
		if (rects.length) {
			const firstLineWidth = rects[0].width;
			adviceContainer.style.setProperty("--_advice-text-width", `${firstLineWidth}px`);
		} else {
			adviceContainer.style.setProperty("--_advice-text-width", `0px`);
		}
	}
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

function setUIInteractive(isInteractive, elements) {
	// Destructure the static elements that are always present
	const {
		generateButton,
		reviseButton,
		uiModeToggle,
		textInput,
		titleHeader,
		searchInput,
	} = elements;

	// Combine static elements with dynamically queried elements.
	// This query runs every time to catch elements that are added/removed from the DOM.
	const allInteractiveElements = [
		generateButton,
		reviseButton,
		uiModeToggle,
		textInput,
		titleHeader,
		searchInput,
		...document.querySelectorAll(
			"#save-theme-button, .edit-theme-name-btn, .color-chip, .load-btn, .save-btn, .delete-btn, .edit-theme-advice-btn, .add-advice-btn"
		),
	];

	allInteractiveElements.forEach((el) => {
		if (!el) return;

		const tagName = el.tagName.toUpperCase();

		// Use the 'disabled' property for semantic form elements
		if (tagName === "BUTTON" || tagName === "TEXTAREA" || tagName === "INPUT") {
			el.disabled = !isInteractive;
		} else {
			// For all other elements (like DIVs, H1s), toggle a CSS class
			el.classList.toggle("interaction-disabled", !isInteractive);
		}
	});

	// Update button text and titles specifically for generation
	if (generateButton && uiModeToggle) {
		if (!isInteractive) {
			generateButton.textContent = "Generating...";
			uiModeToggle.title = "Generating...";
		} else {
			generateButton.textContent = "Generate";
			// The title for uiModeToggle will be correctly reset by applyTheme
		}
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

function initializeCharacterCounter() {
	const textInput = document.getElementById("text-input");
	const characterCounter = document.getElementById("character-counter");
	const warningMessage = document.getElementById("warning-message");

	function updateCharacterCounter() {
		const currentLength = textInput.value.length;
		const maxLength = 1000;

		// Update counter text
		characterCounter.textContent = `${currentLength}/${maxLength} characters`;

		// Update counter color based on usage
		if (currentLength >= maxLength) {
			characterCounter.classList.add("at-limit");
			warningMessage.style.display = "block";
		} else if (currentLength >= maxLength * 0.9) {
			// 90% of limit
			characterCounter.classList.add("near-limit");
			characterCounter.classList.remove("at-limit");
			warningMessage.style.display = "none";
		} else {
			characterCounter.classList.remove("near-limit", "at-limit");
			warningMessage.style.display = "none";
		}
	}

	// Add event listeners for real-time updates
	textInput.addEventListener("input", updateCharacterCounter);
	textInput.addEventListener("paste", function() {
		// Use setTimeout to ensure the pasted content is processed
		setTimeout(updateCharacterCounter, 0);
	});

	// Initialize counter on page load
	updateCharacterCounter();
}

// Call this function when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeCharacterCounter);

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
	return {
		h,
		s,
		l
	};
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

/* ------------ iPad 1× lock + global hide for density controls ------------ */

// Robust iPad / iPadOS detection (covers iPadOS that reports as "Mac")
function isIPad() {
	const ua = navigator.userAgent || navigator.vendor || "";
	return (
		/\biPad\b/i.test(ua) ||
		(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
	);
}

// Force the grid to 1× and flip a GLOBAL html flag that CSS listens to
function lockDensityTo1x() {
	const grid = document.getElementById("saved-themes-list");
	if (grid) {
		grid.removeAttribute("data-density"); // 1× = no attribute
		grid.dataset.lockDensity = "1"; // local marker (optional)
	}

	// Global flag → CSS hides all current/future .density-controls instances
	document.documentElement.setAttribute("data-density-locked", "1");

	// If the buttons are already in DOM, make them inert (harmless redundancy)
	document.querySelectorAll(".density-controls button").forEach((b) => {
		b.disabled = true;
		b.classList.remove("active");
		b.title = "Locked to 1× on iPad";
	});
}

// Remove the lock and show controls again (for non-iPad or when leaving lock)
function unlockDensity() {
	const grid = document.getElementById("saved-themes-list");
	if (grid) {
		delete grid.dataset.lockDensity;
	}
	document.documentElement.removeAttribute("data-density-locked");

	document.querySelectorAll(".density-controls button").forEach((b) => {
		b.disabled = false;
		if (b.dataset?.density) b.title = `${b.dataset.density}×`;
	});
}

// Wrap global applyDensity so existing callers keep working safely
(function wrapApplyDensity() {
	const orig = window.applyDensity;
	window.applyDensity = function(n, opts = {}) {
		const force = !!opts.force;
		const grid = document.getElementById("saved-themes-list");

		// If iPad locked and not forced, keep 1× and exit
		if (
			isIPad() &&
			document.documentElement.getAttribute("data-density-locked") === "1" &&
			!force
		) {
			lockDensityTo1x();
			return;
		}

		// Delegate to original if present
		if (typeof orig === "function") return orig.call(this, n, opts);

		// Minimal fallback implementation
		if (!grid) return;
		if (n === 1) grid.removeAttribute("data-density");
		else grid.setAttribute("data-density", String(n));
		document
			.querySelectorAll(".density-controls button")
			.forEach((b) =>
				b.classList.toggle("active", Number(b.dataset.density) === n)
			);
	};
})();

// Ensure the zoom/density check respects the lock
(function wrapCheckZoom() {
	const orig = window.checkZoomAndToggleDensityButtons;
	window.checkZoomAndToggleDensityButtons = function() {
		if (
			isIPad() &&
			document.documentElement.getAttribute("data-density-locked") === "1"
		) {
			lockDensityTo1x();
			return; // short-circuit any downstream logic
		}
		if (typeof orig === "function") return orig.apply(this, arguments);
	};
})();

// Keep the lock through resize/orientation and revert any stray changes
function installIPadLockGuards() {
	const grid = document.getElementById("saved-themes-list");
	const reLock = () => lockDensityTo1x();

	// Re-lock on viewport changes (some code paths may re-run on resize)
	window.addEventListener("resize", reLock, {
		passive: true
	});
	window.addEventListener("orientationchange", reLock, {
		passive: true
	});

	// If any code sets data-density later, immediately remove it
	if (grid) {
		const mo = new MutationObserver((muts) => {
			for (const m of muts) {
				if (m.type === "attributes" && m.attributeName === "data-density") {
					grid.removeAttribute("data-density");
				}
			}
		});
		mo.observe(grid, {
			attributes: true,
			attributeFilter: ["data-density"]
		});
	}
}

// Boot
document.addEventListener("DOMContentLoaded", () => {
	if (isIPad()) {
		lockDensityTo1x(); // pins 1× and sets html[data-density-locked="1"]
		installIPadLockGuards(); // keeps it pinned
	} else {
		unlockDensity(); // restores normal behavior off-iPad
	}
});