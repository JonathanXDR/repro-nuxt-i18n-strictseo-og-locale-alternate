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

The non-strict path computes the list correctly from
`options.locales.map(x => x.language || x.code)`.

## Steps to reproduce

```bash
npm install
npm run generate
grep -oE '<meta[^>]*og:locale[^>]*>' .output/public/de/index.html
```

(StackBlitz runs exactly this via `.stackblitzrc`.)

## Actual (strictSeo: true)

```html
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="de">
<meta property="og:locale:alternate" content="en">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:locale:alternate" content="fr">
<meta property="og:locale:alternate" content="fr_FR">
```

## Expected (control case)

```html
<meta id="i18n-og" property="og:locale" content="de_DE">
<meta id="i18n-og-alt-en-US" property="og:locale:alternate" content="en_US">
<meta id="i18n-og-alt-fr-FR" property="og:locale:alternate" content="fr_FR">
```

To verify the control case: set `experimental.strictSeo: false` in
`nuxt.config.ts` and uncomment the two `useLocaleHead` lines in `app/app.vue`,
then re-run `npm run generate` and grep the same file. Note that under strictSeo
the manual `useLocaleHead` call must stay commented out, because strictSeo throws
("Strict SEO mode is enabled, `useLocaleHead` should not be used") if it is left
in place.

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
- node: 24.x
- macOS (darwin 25.5.0)

Confirmed live on 2026-06-25 with the prerendered `nuxt generate` output.
