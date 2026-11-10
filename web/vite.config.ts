import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const BUILD = `${(process.env.VERCEL_GIT_COMMIT_SHA || 'yerel').slice(0, 7)} · ${new Date().toISOString().slice(0, 10)}`

export default defineConfig({
  // göreli yollar: uygulama kökte (Vercel) ya da alt klasörde (GitHub Pages) aynı derlemeyle çalışır
  base: './',
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 700 },
})
