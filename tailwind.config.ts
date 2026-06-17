import type { Config } from "tailwindcss";

// Tailwind v4: most config is done via @theme in CSS.
// This file is kept for IDE support only.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};

export default config;
