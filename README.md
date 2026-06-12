# Repro: `strictSeo` emits invalid `og:locale:alternate` values

`@nuxtjs/i18n` **10.4.0** with `experimental.strictSeo: true` builds the
`og:locale:alternate` meta tags from the **hreflang link list** instead of from
the locales' `language` tags. The hreflang list intentionally contains bare
language "catchall" entries (`de`, `en`, `fr`), which are then re-emitted as
`og:locale:alternate` values.

Two defects follow:

1. **Invalid OG values.** The [Open Graph protocol](https://ogp.me/#optional)
   defines `og:locale` values in `language_TERRITORY` format. Bare `de` / `en` /
   `fr` are not valid values.
2. **Self-referencing alternate.** The current locale's catchall (`de` on a
   `de-DE` page) survives the `locale !== currentLanguage` filter, so the page
   lists its own language as an alternate of itself.

The non-strict path (manual `useLocaleHead`) computes the list correctly from
`options.locales.map(x => x.language || x.code)`.

## Steps to reproduce

```bash
bun install   # or npm install
bun run dev
curl -s http://localhost:3000/de | grep -oE '<meta[^>]*og:locale[^>]*>'
```

## Actual (strictSeo: true)

```html
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="de">
<meta property="og:locale:alternate" content="en">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:locale:alternate" content="fr">
<meta property="og:locale:alternate" content="fr_FR">
```

## Expected (what `strictSeo: false` + manual `useLocaleHead({ seo: true })` in `app.vue` produces)

```html
<meta id="i18n-og" property="og:locale" content="de_DE">
<meta id="i18n-og-alt-en-US" property="og:locale:alternate" content="en_US">
<meta id="i18n-og-alt-fr-FR" property="og:locale:alternate" content="fr_FR">
```

To verify the control case yourself: set `experimental.strictSeo: false` in
`nuxt.config.ts` (the manual `useLocaleHead` wiring in `app/app.vue` is already
in place) and re-run the `curl`.

## Root cause

`dist/runtime/kit/head.js`, inside `localeHead()`:

```js
getAlternateOgLocales(
  options,
  strictSeo
    ? alternateLinks.map((x) => x.hreflang).filter((x) => x !== "x-default")
    : options.locales.map((x) => x.language || x.code)
)
```

`alternateLinks` comes from `getHreflangLinks()`, whose `createLocaleMap()`
deliberately adds a bare-language catchall entry per language (correct for
hreflang). Reusing that list for `og:locale:alternate` leaks the catchalls, and
the bare `de` entry no longer equals `currentLanguage` (`de-DE`), so the
self-exclusion filter in `getAlternateOgLocales()` misses it.

Both code paths should derive OG alternates from
`options.locales.map(x => x.language || x.code)`.

## Environment

- @nuxtjs/i18n: 10.4.0
- nuxt: 4.4.8
- vue: 3.5.38
- node: 24.x / bun 1.x
- macOS (darwin 25.5.0)

Confirmed live on 2026-06-12 with both dev server SSR output and the
production build.
