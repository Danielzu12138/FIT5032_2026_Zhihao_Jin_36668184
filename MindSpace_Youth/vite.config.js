import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@firebase/') || id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/@fullcalendar')) return 'calendar'
          if (id.includes('node_modules/leaflet')) return 'map'
          if (id.includes('node_modules/chart.js')) return 'charts'
        },
      },
    },
  },
})
