import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  define: {
    'process.env': {
      NODE_ENV: '"development"',
      VITE_API_URL: process.env.services__apiservice__http__0

    }
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})
