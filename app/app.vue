<script setup lang="ts">
// Manual SEO head wiring, required when strictSeo is off. With strictSeo on,
// the module applies the same localeHead() output automatically, so both
// setups exercise the identical head-generation code path in
// dist/runtime/kit/head.js and differ only in the languages list passed to
// getAlternateOgLocales().
const head = useLocaleHead({ seo: true })
useHead(head)
</script>

<template>
  <NuxtPage />
</template>
