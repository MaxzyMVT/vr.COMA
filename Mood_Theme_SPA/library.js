const updateTheme = (colors) => {
                if (colors) {
                    document.documentElement.style.setProperty('--bg-color', colors.backgroundColor || '#f7f3f1');
                    document.documentElement.style.setProperty('--primary-color', colors.primaryColor || '#333333');
                    document.documentElement.style.setProperty('--secondary-color', colors.secondaryColor || '#6a6a6a');
                    document.documentElement.style.setProperty('--accent-color', colors.accentColor || '#ff5722');
                    document.documentElement.style.setProperty('--container-bg', colors.containerBackground || '#ffffff');
                    document.documentElement.style.setProperty('--border-color', colors.borderColor || '#e0e0e0');
                    document.documentElement.style.setProperty('--shadow-color', colors.shadowColor || 'rgba(0, 0, 0, 0.1)');
                }
        };