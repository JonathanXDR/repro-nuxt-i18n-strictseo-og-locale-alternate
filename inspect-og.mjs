import { readFileSync } from 'node:fs'

// WebContainer's jsh shell has no `grep`, so the bug evidence is printed with
// node instead. Reads the prerendered de/ and en/ pages and prints their
// og:locale / og:locale:alternate meta tags.
for (const path of ['.output/public/de/index.html', '.output/public/en/index.html']) {
  const html = readFileSync(path, 'utf8')
  const tags = html.match(/<meta[^>]*property="og:locale[^>]*>/g) || []
  console.log(`----- og:locale tags in ${path} (strictSeo: true) -----`)
  console.log(tags.length ? tags.join('\n') : '(no og:locale tags found)')
  console.log('')
}
console.log('Expected on /de/: og:locale=de_DE plus og:locale:alternate=en_US, fr_FR only.')
console.log('Bug: invalid bare de/en/fr values are emitted AND the current locale self-lists.')
