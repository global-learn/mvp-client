import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Dev-only proxy target. Has NO effect on `vite build` / production — there
  // the API origin comes from VITE_API_URL at build time. Override per-machine
  // via DEV_API_TARGET in .env (e.g. http://localhost:3000 or the WSL host).
  const devApiTarget = env.DEV_API_TARGET || 'http://localhost:3000'

  return {
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: devApiTarget,
        changeOrigin: true,
      },
      // socket.io engine path — shared by the /chat and /notifications
      // namespaces. ws:true upgrades the WebSocket through the proxy.
      '/socket.io': {
        target: devApiTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
  resolve: {
    // Алиасы — короткие имена вместо длинных относительных путей.
    // Вместо '../../../entities/course/...' пишем '@entities/course/...'
    // Это стандарт для FSD проектов.
    alias: {
      '@app': path.resolve(__dirname, 'src/app'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@widgets': path.resolve(__dirname, 'src/widgets'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@entities': path.resolve(__dirname, 'src/entities'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  }
})
