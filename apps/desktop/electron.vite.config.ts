import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    plugins: [
      react(),
      vanillaExtractPlugin(),
      {
        name: 'development-csp',
        apply: 'serve',
        transformIndexHtml(html) {
          return html
            .replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")
            .replace("style-src 'self'", "style-src 'self' 'unsafe-inline'")
            .replace("connect-src 'none'", "connect-src 'self' ws://127.0.0.1:5173");
        },
      },
    ],
    build: { minify: 'esbuild' },
    server: { host: '127.0.0.1', port: 5173, strictPort: true },
  },
});
