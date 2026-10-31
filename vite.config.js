import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login.html'),
        signup: resolve(import.meta.dirname, 'signup.html'),
        textMode: resolve(import.meta.dirname, 'text-mode.html'),
        virtualDoctor: resolve(import.meta.dirname, 'virtual-doctor.html'),
        profile: resolve(import.meta.dirname, 'profile.html'),
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
})
