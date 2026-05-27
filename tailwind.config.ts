import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FDFBF7",
        pointRed: "#E63946",
      },
      fontFamily: {
        pretendard: ["Pretendard", "ui-sans-serif", "system-ui", "sans-serif"],
        "nanum-gothic": ["Nanum Gothic", "sans-serif"],
        "nanum-myeongjo": ["Nanum Myeongjo", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;

