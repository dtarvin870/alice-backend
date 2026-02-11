import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  return {
    base: mode === 'production' ? '/alice/' : '/',
    plugins: [react()],
    server: {
      port: 1337,
      host: '0.0.0.0'
    }
  }
})
