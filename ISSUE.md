# [Issue draft for nuxt-modules/i18n — bug-report template]

## Title

`experimental.strictSeo` emits invalid bare `og:locale:alternate` values and self-lists the current locale

## Environment

- Operating System: Darwin (macOS)
- Node Version: v24.x
- Nuxt Version: 4.4.8
- Nitro Version: 2.13.4
- Package Manager: npm (bun also reproduces)
- Runtime Modules: `@nuxtjs/i18n@10.4.0`

## Reproduction

https://stackblitz.com/github/JonathanXDR/repro-nuxt-i18n-strictseo-og-locale-alternate

## Describe the bug

With `experimental.strictSeo: true`, the `og:locale:alternate` meta tags are derived from the hreflang link list instead of from the locales' `language` tags. `getHreflangLinks()` deliberately adds a bare-language catchall entry per language (`de`, `en`, `fr`), which is correct for `hreflang`, but those bare entries leak into `og:locale:alternate`.

The generated `/de` page (strictSeo: true) contains:

```html
<meta property="og:locale" content="de_DE">
<meta property="og:locale:alternate" content="de">
<meta property="og:locale:alternate" content="en">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:locale:alternate" content="fr">
<meta property="og:locale:alternate" content="fr_FR">
```

Two defects follow:

1. Invalid OG values. The Open Graph protocol (https://ogp.me/#optional) defines `og:locale` values as `language_TERRITORY`. Bare `de` / `en` / `fr` are not valid values.
2. Self-referencing alternate. The current locale's catchall `de` is not equal to `currentLanguage` (`de-DE`), so it survives the self-exclusion filter in `getAlternateOgLocales()` and the page lists its own language as an alternate of itself.

## Expected behavior

The strictSeo path should derive OG alternates from the locales' `language` tags, the same source the non-strict path already uses. With `strictSeo: false` (and the manual `useLocaleHead({ seo: true })` wiring that strictSeo replaces) the same page emits only valid, non-self-referencing values:

```html
<meta id="i18n-og" property="og:locale" content="de_DE">
<meta id="i18n-og-alt-en-US" property="og:locale:alternate" content="en_US">
<meta id="i18n-og-alt-fr-FR" property="og:locale:alternate" content="fr_FR">
```

## Additional context

Root cause is in `dist/runtime/kit/head.js`, inside `localeHead()`. The strictSeo branch feeds the hreflang list into `getAlternateOgLocales()`:

```js
// dist/runtime/kit/head.js:26
getAlternateOgLocales(
  options,
  strictSeo
    ? alternateLinks.map((x) => x.hreflang).filter((x) => x !== "x-default")
    : options.locales.map((x) => x.language || x.code)
)
```

`alternateLinks` comes from `getHreflangLinks()`, whose `createLocaleMap()` adds a bare-language key alongside the full `language` key (`dist/runtime/kit/head.js:40`):

```js
// dist/runtime/kit/head.js:39-43
const [language, region] = locale.language.split("-");
if (language && region && (locale.isCatchallLocale || !localeMap.has(language))) {
  localeMap.set(language, locale);
}
localeMap.set(locale.language, locale);
```

The self-exclusion filter in `getAlternateOgLocales()` only drops the exact `currentLanguage`, so the bare catchall slips through (`dist/runtime/kit/head.js:124`):

```js
const alternateLocales = languages.filter((locale) => locale && locale !== currentLanguage);
```

Both code paths should derive OG alternates from `options.locales.map(x => x.language || x.code)`. The catchall behavior of `createLocaleMap()` is correct for `hreflang`; the defect is only the reuse of that list for `og:locale:alternate` on the strictSeo path.

Note: under strictSeo, calling `useLocaleHead` manually throws ("Strict SEO mode is enabled, `useLocaleHead` should not be used"), so the strict and non-strict cases are exercised by toggling `experimental.strictSeo` in `nuxt.config.ts`, not by keeping the manual wiring in place.

## Logs

(none, prerendered SSR output shown above)
