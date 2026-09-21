import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// MediaPipe WASM requires SharedArrayBuffer, which needs these
// Cross-Origin Isolation headers.
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  // Prevent Vite from pre-bundling @mediapipe/tasks-vision
  // (it ships its own ES module and WASM loader)
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
})
