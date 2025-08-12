// src/i18n/index.ts
import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import fr from './locales/fr.json'

export default createI18n({
  legacy: false, // Use Composition API
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    fr
  }
})