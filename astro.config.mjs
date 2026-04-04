import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  // Your original GitHub Pages deployment settings
  site: 'https://sloewlly.github.io',
  base: '/portfolio',

  // Your new Tailwind CSS v4 configuration
  vite: {
    plugins: [tailwindcss()],
  },
});