import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    cors: true, // Разрешаем CORS для Webflow
    origin: 'http://localhost:5173',
    allowedHosts: true,
  },
  build: {
    // Собираем как библиотеку (виджет)
    lib: {
      entry: resolve(__dirname, 'src/webflow/boot.tsx'),
      name: 'R3FPoc',
      fileName: (format) => `r3f-poc.${format}.js`,
      formats: ['es', 'umd'], // ES для современных, UMD для совместимости
    },
    rollupOptions: {
      // external: ['react', 'react-dom'],
      output: {
        // Глобальные переменные для UMD сборки
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        // Стабильные имена файлов без хешей для CDN
        entryFileNames: 'r3f-poc-prod.js',
        assetFileNames: 'r3f-poc-prod.[ext]',
      },
    },
    cssCodeSplit: false, // Весь CSS в один файл
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
})
