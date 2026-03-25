import type { Config } from "tailwindcss";

const config: Config = {
    // CRITICAL: Tells Tailwind where to look for your classes
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "tertiary": "#006a34",
                "background": "#f5f6f7",
                "surface-dim": "#d1d5d7",
                "tertiary-fixed-dim": "#78ef9a",
                "inverse-primary": "#82edaa",
                "tertiary-container": "#86fea7",
                "on-secondary-fixed-variant": "#346454",
                "on-surface-variant": "#595c5d",
                "on-secondary-fixed": "#144739",
                "surface-container-high": "#e0e3e4",
                "secondary-dim": "#275849",
                "secondary-fixed-dim": "#acdfcb",
                "primary-dim": "#005c34",
                "surface-container-highest": "#dadddf",
                "inverse-surface": "#0c0f10",
                "primary-container": "#82edaa",
                "on-background": "#2c2f30",
                "on-primary-container": "#005730",
                "on-surface": "#2c2f30",
                "error": "#b31b25",
                "on-primary-fixed": "#004123",
                "secondary-fixed": "#baeed9",
                "primary-fixed": "#82edaa",
                "on-secondary": "#cafee9",
                "outline-variant": "#abadae",
                "on-tertiary": "#cdffd4",
                "tertiary-dim": "#005c2d",
                "secondary-container": "#baeed9",
                "on-error-container": "#570008",
                "surface-bright": "#f5f6f7",
                "on-error": "#ffefee",
                "surface-variant": "#dadddf",
                "on-tertiary-fixed": "#004c23",
                "surface-tint": "#006a3c",
                "tertiary-fixed": "#86fea7",
                "surface-container": "#e6e8ea",
                "primary-fixed-dim": "#74de9d",
                "outline": "#757778",
                "surface-container-low": "#eff1f2",
                "surface": "#f5f6f7",
                "on-tertiary-fixed-variant": "#006c35",
                "primary": "#006a3c",
                "error-container": "#fb5151",
                "on-primary-fixed-variant": "#006137",
                "on-primary": "#cbffd8",
                "on-secondary-container": "#2a5a4b",
                "inverse-on-surface": "#9b9d9e",
                "surface-container-lowest": "#ffffff",
                "on-tertiary-container": "#00612f",
                "error-dim": "#9f0519",
                "secondary": "#346454"
            },
            fontFamily: {
                "headline": ["var(--font-space-grotesk)", "sans-serif"],
                "editorial": ["var(--font-bricolage-grotesque)", "sans-serif"],
                "body": ["var(--font-inter)", "sans-serif"],
                "label": ["var(--font-inter)", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "1.5rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
};

export default config;