import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
          900: "#1e3a8a",
        },
        surface: {
          DEFAULT: "#f8fafc",
          card: "#ffffff",
          border: "#e2e8f0",
        },
      },
      maxWidth: {
        mobile: "480px",
        tablet: "1024px",
      },
    },
  },
  plugins: [],
};

export default config;
