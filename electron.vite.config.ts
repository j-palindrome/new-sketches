import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { glslify } from 'vite-plugin-glslify'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), tsconfigPaths()]
  },
  preload: {
    plugins: [externalizeDepsPlugin(), tsconfigPaths()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          controls: resolve(__dirname, 'src/preload/controls.ts')
        }
      }
    }
  },
  renderer: {
    plugins: [react(), tsconfigPaths(), glslify()],
    define: {
      global: {}
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/main/index.html'),
          controls: resolve(__dirname, 'src/renderer/controls/index.html')
        }
      }
    }
  }
})
