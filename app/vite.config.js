import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // 🐛 FIX FOR UNCAUGHT SYNTAX ERROR 
  optimizeDeps: {
    // Explicitly exclude 'sessionhalt' to prevent Vite from pre-bundling it.
    // This forces Vite to treat it as a source file that correctly exports
    // getCanvasNumericData.
    exclude: ['sessionhalt'],
  },
  
  server: {
    host: true, // binds to all network interfaces
    port: 5173, // optional: pick another port if needed
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
})