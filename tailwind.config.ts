import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f1115",
          raised: "#171a21",
          border: "#262b36",
        },
        accent: {
          DEFAULT: "#5b8cff",
          muted: "#3a5bb0",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
