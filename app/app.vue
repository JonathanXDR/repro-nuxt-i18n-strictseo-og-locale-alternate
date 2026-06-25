<script setup lang="ts">
// With `experimental.strictSeo: true` the module injects the localized head
// tags automatically via dist/runtime/kit/head.js (localeHead()), so no manual
// wiring is needed here. Calling `useLocaleHead` under strictSeo throws, which
// is why this file is intentionally empty.
//
// To verify the non-strict control case: set `strictSeo: false` in
// nuxt.config.ts and uncomment the two lines below.
// const head = useLocaleHead({ seo: true })
// useHead(head)
</script>

<template>
  <NuxtPage />
</template>
