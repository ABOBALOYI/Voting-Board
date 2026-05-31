import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";

// HeroUI ships its components as compiled classes, so its theme path must be in
// `content` for Tailwind to emit the utilities those components rely on.
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  // HeroUI bundles its own tailwindcss copy, so its plugin's PluginAPI type
  // differs from the project's. The runtime plugin is correct; the cast just
  // bridges the cosmetic type mismatch between the two tailwindcss copies.
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            // A clean, confident blue as the brand accent across the light theme.
            primary: {
              50: "#eff6ff",
              100: "#dbeafe",
              200: "#bfdbfe",
              300: "#93c5fd",
              400: "#60a5fa",
              500: "#3b82f6",
              600: "#2563eb",
              700: "#1d4ed8",
              800: "#1e40af",
              900: "#1e3a8a",
              DEFAULT: "#2563eb",
              foreground: "#ffffff",
            },
            // Slightly cool, soft page background so white cards lift off it.
            background: "#f7f9fc",
          },
        },
      },
    }),
  ] as unknown as Config["plugins"],
};

export default config;
