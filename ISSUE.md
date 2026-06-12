# [Issue draft for nuxt-modules/i18n — bug report template]

## Title

`experimental.strictSeo` emits invalid `og:locale:alternate` values (bare hreflang catchall codes, including the current locale's own language)

## Environment

- Operating System: Darwin (macOS)
- Node Version: v24.x
- Nuxt Version: 4.4.8
- CLI Version: (bundled @nuxt/cli)
- Nitro Version: 2.13.4
- Package Manager: bun 1.x
- Builder: -
- User Config: `i18n`
- Runtime Modules: `@nuxtjs/i18n@10.4.0`
- Build Modules: -

## Reproduction

https://github.com/JonathanXDR/repro-nuxt-i18n-strictseo-og-locale-alternate

(3 locales `de-DE` / `en-US` / `fr-FR`, `strategy: 'prefix'`, `experimental.strictSeo: true`, then `curl -s http://localhost:3000/de | grep og:locale`)

## Describe the bug

With `experimental.strictSeo: true`, the `og:locale:alternate` meta tags are derived from the **hreflang link list** instead of the locales' `language` tags. `getHreflangLinks()` intentionally includes a bare-language catchall entry per language (`de`, `en`, `fr`), which is correct for `hreflang`, but those entries leak into `og:locale:alternate`:

```html
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="de">
<meta property="og:locale:alternate" content="en">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:locale:alternate" content="fr">
<meta property="og:locale:alternate" content="fr_FR">
```

Two problems:

1. The Open Graph protocol defines locale values as `language_TERRITORY`; bare `de`/`en`/`fr` are invalid.
2. On the `de-DE` page, the bare `de` catchall is not equal to `currentLanguage` (`de-DE`), so it survives the self-exclusion filter in `getAlternateOgLocales()` and the page lists its own language as its alternate.

The non-strict path computes the list correctly: with `strictSeo: false` and a manual `useHead(useLocaleHead({ seo: true }))`, the same page emits only `en_US` and `fr_FR`.

Root cause in `dist/runtime/kit/head.js` (`localeHead()`):

```js
getAlternateOgLocales(
  options,
  strictSeo
    ? alternateLinks.map((x) => x.hreflang).filter((x) => x !== "x-default")
    : options.locales.map((x) => x.language || x.code)
)
```

Expected: both paths should pass `options.locales.map(x => x.language || x.code)` (the hreflang list is the wrong source for OG locales).

## Additional context

The catchall behavior of `createLocaleMap()` is documented and correct for `hreflang` generation. The defect is only the reuse of that list for `og:locale:alternate` on the strictSeo code path.

## Logs

(none, SSR output shown above)
