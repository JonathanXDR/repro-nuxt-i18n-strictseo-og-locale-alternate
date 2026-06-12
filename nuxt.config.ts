export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  compatibilityDate: '2026-03-21',
  i18n: {
    baseUrl: 'http://localhost:3000',
    strategy: 'prefix',
    defaultLocale: 'de',
    experimental: {
      strictSeo: true,
    },
    locales: [
      { code: 'de', language: 'de-DE', name: 'Deutsch' },
      { code: 'en', language: 'en-US', name: 'English' },
      { code: 'fr', language: 'fr-FR', name: 'Français' },
    ],
  },
})
