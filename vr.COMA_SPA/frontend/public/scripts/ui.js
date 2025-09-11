function mixHex(c1, c2, w = 0.35) {
	const n = (s) => parseInt(s.replace("#", ""), 16);
	const toHex = (v) => v.toString(16).padStart(2, "0");
	const r1 = (n(c1) >> 16) & 255,
		g1 = (n(c1) >> 8) & 255,
		b1 = n(c1) & 255;
	const r2 = (n(c2) >> 16) & 255,
		g2 = (n(c2) >> 8) & 255,
		b2 = n(c2) & 255;
	const r = Math.round(r1 * (1 - w) + r2 * w);
	const g = Math.round(g1 * (1 - w) + g2 * w);
	const b = Math.round(b1 * (1 - w) + b2 * w);
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function luminance(hex) {
	const n = parseInt(hex.slice(1), 16);
	const r = (n >> 16) & 255,
		g = (n >> 8) & 255,
		b = n & 255;
	const lin = (c) => {
		const v = c / 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function computeDanger(theme) {
	const accent = theme.colors.accent; // e.g. #FFA500
	const mixed = mixHex(accent, "#000000", 0.35); // accent + 35% black
	const bg = mixHex(mixed, theme.colors.interactiveBackground || "#ffffff", 0.25); // soften a bit
	const text = luminance(bg) < 0.5 ? "#ffffff" : "#000000";
	return { dangerBackground: bg, dangerText: text };
}

function applyTheme(theme, previewThemeName) {
	if (!theme || !theme.colors) return;

	// Compute and add danger colors to the theme object
	const danger = computeDanger(theme);
	theme.colors.dangerBackground = danger.dangerBackground;
	document.documentElement.style.setProperty("--danger-text", theme.colors.dangerText);

	const root = document.documentElement;
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
		"--danger-bg": theme.colors.dangerBackground,
	};

	for (const [variable, color] of Object.entries(colorMap)) {
		if (color) {
			root.style.setProperty(variable, color);
		}
	}

	// apply text var separately
  	root.style.setProperty("--danger-text", theme.colors.dangerText || "#000");

	if (previewThemeName) {
		previewThemeName.textContent = theme.themeName;
	}
}

function displayThemeOutput(theme, outputContent) {
	if (!outputContent) return;

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
		dangerBackground: "Mixed Use"
	};

	let colorChipsHTML = "";
	for (const [key, color] of Object.entries(theme.colors)) {
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
        <div class="output-actions">
            <button id="make-dark-button">Make Dark</button>
            <button id="save-theme-button">Save Theme</button>
        </div>
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
        themeItem.setAttribute("draggable", "true");
        themeItem.dataset.id = theme._id;

		themeItem.innerHTML = `
            <span>${theme.themeName}</span>
            <div class="saved-theme-buttons">
                <button class="load-btn" data-id="${theme._id}">Load</button>
                <button class="rename-btn" data-id="${theme._id}">Rename</button>
                <button class="delete-btn" data-id="${theme._id}">Delete</button>
            </div>`;
		
        savedThemesList.appendChild(themeItem);

        // Selection behavior — toggle "selected" class and reveal action buttons
        themeItem.addEventListener('click', (e) => {
            // Ignore clicks on the action buttons themselves
            if (e.target.closest('button')) return;

            // Deselect any other item that is currently selected
            const currentlySelected = savedThemesList.querySelector('.saved-theme-item.selected');
            if (currentlySelected && currentlySelected !== themeItem) {
                currentlySelected.classList.remove('selected');
            }
            
            // Toggle the selected class on the clicked item
            themeItem.classList.toggle('selected');
        });
	});
}

function setLoadingState(isLoading, generateButton, reviseButton) {
	if (generateButton) {
		generateButton.disabled = isLoading;
		generateButton.textContent = isLoading ? "Generating..." : "Generate";
	}
	if (reviseButton) {
		reviseButton.disabled = isLoading || !currentTheme;
	}
}

// minimal drag reorder
(() => {
  const list = document.getElementById('saved-themes-list');
  if (!list) return;
  let dragging;

  list.addEventListener('dragstart', e => {
    if (!e.target.matches('.saved-theme-item')) return;
    dragging = e.target;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => e.target.classList.add('dragging'), 0);
  });
  list.addEventListener('dragend', e => {
    e.target.classList.remove('dragging');
    dragging = null;
    const ids = [...list.querySelectorAll('.saved-theme-item')].map(n => n.dataset.id);
    // Note: You would need to implement api.reorderThemes and a backend route for this to persist.
    // window.api?.reorderThemes?.(ids); 
  });
  list.addEventListener('dragover', e => {
    e.preventDefault();
    const after = [...list.querySelectorAll('.saved-theme-item:not(.dragging)')]
      .find(el => e.clientY <= el.getBoundingClientRect().top + el.offsetHeight / 2);
    if (!dragging) return;
    after ? list.insertBefore(dragging, after) : list.appendChild(dragging);
  });
})();