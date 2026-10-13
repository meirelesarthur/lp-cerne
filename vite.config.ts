import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // O preview atribui a porta via PORT; sem ela, usa o padrão do Vite (5173).
  server: { port: process.env.PORT ? Number(process.env.PORT) : 5173 },
})
