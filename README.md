# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## SvelTeX Configuration

This project uses [SvelTeX](https://sveltex.dev) for processing markdown blog posts with LaTeX math and code highlighting.

### Backends

- **Markdown**: `unified` - Industry-standard markdown processor
- **Code**: `shiki` - Beautiful syntax highlighting
- **Math**: `mathjax` - Professional LaTeX math rendering

### Peer Dependencies

The following packages are required as peer dependencies by `@nvl/sveltex`:

- `unified`, `remark-parse`, `remark-rehype`, `remark-retext`, `rehype-stringify` - Markdown processing pipeline
- `hast-util-to-html` - HTML transformation utilities
- `shiki` - Code syntax highlighting
- `mathjax-full` - LaTeX math rendering

These are listed in `devDependencies` and will be installed automatically with `npm install`.
