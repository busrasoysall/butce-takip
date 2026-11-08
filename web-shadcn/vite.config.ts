import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Derleme çıktısı kök dizindeki prototip/shadcn klasörüne gider; böylece
// mevcut statik site (Vercel) onu /prototip/shadcn/ adresinde yayınlar.
export default defineConfig({
  base: '/prototip/shadcn/',
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: { outDir: '../prototip/shadcn', emptyOutDir: true },
})
