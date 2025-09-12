async function apiGenerateTheme(prompt) {
	const response = await fetch(`${BACKEND_URL}/api/generate-theme`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ prompt }),
	});
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to generate theme.");
	}
	return response.json();
}

async function apiLoadThemes() {
	try {
		const response = await fetch(`${BACKEND_URL}/api/themes`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const themes = await response.json();
		return themes;
	} catch (error) {
		console.error("Error in apiLoadThemes:", error);
		throw error;
	}
}

async function apiSaveTheme(themeData) {
	const response = await fetch(`${BACKEND_URL}/api/themes`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(themeData),
	});

	if (!response.ok) {
		// If the server responds with an error, throw an error to be caught by the handler
		const errorData = await response.json();
		throw new Error(
			errorData.error || "Failed to save the theme on the server."
		);
	}

	return response.json(); // Return the saved theme data from the server
}

async function apiDeleteTheme(themeId) {
	const response = await fetch(`${BACKEND_URL}/api/themes/${themeId}`, {
		method: "DELETE",
	});

	// A successful DELETE often returns a 204 "No Content" status.
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({})); // Try to get error, but don't fail if no body
		throw new Error(
			errorData.error ||
				`Failed to delete theme. Server responded with ${response.status}`
		);
	}

	return true;
}

async function apiOverwriteTheme(themeId, newThemeData) {
    const response = await fetch(`${BACKEND_URL}/api/themes/${themeId}`, {
        method: 'PUT', // Use PUT for full replacement
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newThemeData),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to overwrite theme.');
    }

    return response.json();
}