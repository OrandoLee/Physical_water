import { defineConfig } from 'vite'

export default defineConfig({
  // Relative assets work on GitHub Pages project paths and when opening dist/index.html directly.
  // Use base: '/' only if you specifically deploy to a root domain and do not need file:// previews.
  base: './',
})
