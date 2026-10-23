import { defineConfig } from 'vite';
import { resolve } from 'node:path';
// Dev-only mirror of scripts/prerender.mjs: route pages to case.html, render the homepage, and load theme.css last.
const devPages = {
  name: 'dev-pages',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = req.url.split('?')[0];
      if (
        path !== '/' &&
        !path.includes('.') &&
        !path.startsWith('/@') &&
        !path.startsWith('/src/') &&
        !path.startsWith('/node_modules/')
      )
        req.url = '/case.html';
      next();
    });
  },
  transformIndexHtml: {
    order: 'pre',
    async handler(html, { server }) {
      if (html.includes('<!--home-html-->')) {
        const { renderHome } = await server.ssrLoadModule(
          '/src/entry-server.tsx',
        );
        html = html.replace('<!--home-html-->', renderHome());
      }
      // Body placement keeps theme.css after the <style> tags Vite injects into <head> at runtime.
      return html.replace(
        '</body>',
        '<link rel="stylesheet" href="/assets/theme.css"></body>',
      );
    },
  },
};
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [devPages],
  esbuild: { jsx: 'automatic' },
  build: {
    target: 'es2022',
    rollupOptions: isSsrBuild
      ? {}
      : { input: { main: resolve('index.html'), case: resolve('case.html') } },
  },
}));
