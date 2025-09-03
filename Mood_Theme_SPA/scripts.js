document.addEventListener('DOMContentLoaded', () => {
    const textInput = document.getElementById('text-input');
    const submitButton = document.getElementById('submit-button');
    const statusMessage = document.getElementById('status-message');
    const body = document.body;

    const apiKey = GEMINI_API_KEY; // From apikeys.js
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;


    submitButton.addEventListener('click', () => {
        const text = textInput.value.trim();
        if (text) {
            getEmotionTheme(text);
        } else {
            statusMessage.textContent = 'Please enter some text.';
        }
    });

    const getEmotionTheme = async (text) => {
        statusMessage.textContent = 'Analyzing mood...';
        submitButton.disabled = true;

        // Analyze the dominant emotion of the user's text and provide a color theme as a JSON object. The response should be a single JSON object with the following keys a
        const systemPrompt = `nd values:
        - emotion: A string describing the dominant emotion (e.g., 'Happy', 'Sad', 'Calm', 'Excited').
        - themeName: A single word for the theme (e.g., 'Joy', 'Serenity').
        - primaryColor: A hex code for the main text color.
        - secondaryColor: A hex code for a secondary text or detail color.
        - accentColor: A hex code for a vibrant accent color (e.g., for a button).
        - backgroundColor: A hex code for the main page background.
        - containerBackground: A hex code for a background element like a card.
        - borderColor: A hex code for borders.
        - shadowColor: An RGBA or hex code for shadows.

        These are examples of valid responses. Do not include any explanations or additional text, only return the JSON object. 
        The colors should be a string that represent as hex format ("#RRGGBB") or RGBA format ("rgba(R, G, B, A)"). 
        The theme should include all the keys listed above.

        Example happy response:
        {
            "emotion": "Happy",
            "themeName": "Joy",
            "primaryColor": "#FFFFFF",
            "secondaryColor": "#FFD700",
            "accentColor": "#FF6B6B",
            "backgroundColor": "#FFC0CB",
            "containerBackground": "#FFECEE",
            "borderColor": "#FFB6C1",
            "shadowColor": "rgba(255, 107, 107, 0.3)"
        }
        
        Example sad response:
        {
            "emotion": "Sad",
            "themeName": "Melancholy",
            "primaryColor": "#A9B4C2",
            "secondaryColor": "#DDE3E7",
            "accentColor": "#6C7A89",
            "backgroundColor": "#1E2B3A",
            "containerBackground": "#2A3D51",
            "borderColor": "#3D4F62",
            "shadowColor": "rgba(30, 43, 58, 0.5)"
        }
        
        Example angry response:
        {
            "emotion": "Angry",
            "themeName": "Fury",
            "primaryColor": "#FFFFFF",
            "secondaryColor": "#FFD700",
            "accentColor": "#FF0000",
            "backgroundColor": "#660000",
            "containerBackground": "#800000",
            "borderColor": "#FF4500",
            "shadowColor": "rgba(255, 0, 0, 0.5)"
        }
        
        Example calm response:
        {
            "emotion": "Calm",
            "themeName": "Serenity",
            "primaryColor": "#2F4F4F",
            "secondaryColor": "#5F9EA0",
            "accentColor": "#008080",
            "backgroundColor": "#E0FFFF",
            "containerBackground": "#F0FFFF",
            "borderColor": "#AFEEEE",
            "shadowColor": "rgba(47, 79, 79, 0.1)"
        }
        
        FRIENDLY REMINDER: Only return the text for JSON object, do not include any explanations or additional text.
        AND: Include ALL of the keys listed just like in the examples below.
        AND: The name of the keys in object must match EXACTLY as listed above.
        AND: The theme name should be a single word in english and NOT include just a single special characters, use only alphabetic characters, no emojis, but be creative.
        AND: The theme name should NOT longer than 20 characters. 
        AND: The colors should be in such a scheme that the text still be visible against the background.
        AND: You MUST NOT format it as a code block (e.g., by using grave accent).
        `;

        const payload = {
            contents: [{ parts: [{ text: text }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            console.log('Received response:', result);

            const jsonString = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (jsonString) {

                console.log('Received JSON string:', jsonString);

                const themeData = JSON.parse(jsonString);
                updateTheme(themeData);
                statusMessage.textContent = `Theme changed to: ${themeData.themeName}`;
            } else {
                throw new Error('Could not parse response.');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            statusMessage.textContent = 'Failed to analyze mood. Please try again.';
        } finally {
            submitButton.disabled = false;
        }
    };


    // Set a default theme on load
    updateTheme({
        backgroundColor: '#f7f3f1',
        primaryColor: '#333333',
        secondaryColor: '#6a6a6a',
        accentColor: '#ff5722',
        containerBackground: '#ffffff',
        borderColor: '#e0e0e0',
        shadowColor: 'rgba(0, 0, 0, 0.1)'
    });
});