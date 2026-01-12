# alyxya.com blog

Minimal SvelteKit blog that renders posts written in Markdown/LaTeX via
[SvelTeX](https://sveltex.dev) with Tailwind CSS styling.

## Stack

- **SvelteKit 2 / Svelte 5** – application/runtime.
- **Vite 7** – build/dev server.
- **Tailwind CSS 4 + Typography plugin** – prose-friendly styling.
- **SvelTeX** – `.sveltex` content compiled with the recommended backends:
  - `unified` for Markdown parsing (`remark-parse`, `remark-retext`, `remark-rehype`, `rehype-stringify`)
  - `shiki` for code fences
  - `mathjax` (`mathjax-full`) for TeX/LaTeX rendering

All peer dependencies required by this setup live in `devDependencies`, so
`npm install` pulls everything that the SvelTeX docs call for.

## Development

```sh
npm install          # install deps once
npm run dev          # local dev server
npm run check        # type-check + validate Svelte routes
npm run lint         # prettier + eslint
npm run build        # production build
npm run preview      # serve the production build locally
```

## Authoring content

- Posts live in `src/posts` as `.sveltex` files. See
  `src/posts/welcome.sveltex` for frontmatter conventions:
  `title`, `date` (ISO string), optional `description`, and `tags`.
- Each post is automatically available at `/blog/<slug>` where `<slug>` equals
  the filename.
- The blog index at `/blog` loads metadata on the server (`+page.server.ts`),
  sorts by date, and never ships markdown to the client.
- For inline annotations, import `Annotation` from
  `$lib/components/Annotation.svelte` and wrap the annotated text:
  `<Annotation note="Note text">word</Annotation>.`

## SvelTeX wiring

- `sveltex.config.js` follows the docs and exports the preprocessor configured
  with `markdownBackend: 'unified'`, `codeBackend: 'shiki'`, and
  `mathBackend: 'mathjax'`.
- `svelte.config.js` imports that preprocessor, enables `.sveltex` extensions,
  and layers it after `vitePreprocess`.
- `src/app.d.ts` declares the module shape for `.sveltex` files so TypeScript
  knows about the component + metadata exports.
- SvelTeX injects MathJax styles automatically, so no extra static assets are
  required.

With that plumbing in place you can freely mix Markdown, fenced code blocks,
LaTeX, and Svelte components inside your posts using only one file format.
