import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#f7f7f8",
        surface: "#ffffff",
        border: "#e4e4e7",
        "text-primary": "#18181b",
        "text-secondary": "#71717a",
        accent: "#2563eb",
        "accent-hover": "#1d4ed8",
        success: "#16a34a",
        warning: "#d97706",
      },
      borderRadius: {
        card: "8px",
        btn: "6px",
        input: "4px",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
