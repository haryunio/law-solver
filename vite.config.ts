import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages project site path: https://haryunio.github.io/law-solver/
  base: command === "serve" ? "/" : "/law-solver/",
}));
