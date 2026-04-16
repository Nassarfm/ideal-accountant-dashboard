import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Base path for GitHub Pages deployment; matches the repository name.
  base: '/ideal-accountant-dashboard/',
  plugins: [react()],
  server: {
    port: 3000,
  },
});