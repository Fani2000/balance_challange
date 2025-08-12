import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import vuetify from './plugin/vuetify.ts'
import i18n from './i18n'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

import App from './App.vue'
import Dashboard from './views/Dashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard }
  ]
})

const pinia = createPinia()

createApp(App)
  .use(vuetify)
  .use(router)
  .use(i18n)
  .use(pinia)
  .mount('#app')
