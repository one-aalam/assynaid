import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess({ script: true })
    }),
    {
      name: 'copy-manifest',
      writeBundle() {
        // Copy manifest.json to dist
        fs.copyFileSync('src/manifest.json', 'dist/manifest.json');

        // Copy welcome/welcome.html to dist/welcome/welcome.html
        if (!fs.existsSync('dist/welcome')) {
          fs.mkdirSync('dist/welcome', { recursive: true });
        }
        fs.copyFileSync('src/welcome/welcome.html', 'dist/welcome/welcome.html');

        // Create assets directory if it doesn't exist
        if (!fs.existsSync('dist/assets/images')) {
          fs.mkdirSync('dist/assets/images', { recursive: true });
        }

        // Copy logo.svg to dist/assets/images
        fs.copyFileSync('src/assets/images/logo.svg', 'dist/assets/images/logo.svg');

        // Create placeholder icons
        fs.copyFileSync('src/assets/images/logo.svg', 'dist/assets/images/icon-16.png');
        fs.copyFileSync('src/assets/images/logo.svg', 'dist/assets/images/icon-32.png');
        fs.copyFileSync('src/assets/images/logo.svg', 'dist/assets/images/icon-48.png');
        fs.copyFileSync('src/assets/images/logo.svg', 'dist/assets/images/icon-128.png');

        console.log('Manifest and assets copied to dist directory');
      }
    }
  ],
  resolve: {
    alias: {
      $lib: resolve('./src/lib'),
      $components: resolve('./src/lib/components'),
      $stores: resolve('./src/lib/stores'),
      $utils: resolve('./src/lib/utils'),
      $assets: resolve('./src/assets')
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
        content: resolve(__dirname, 'src/content/content.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background' || chunkInfo.name === 'content'
            ? '[name]/[name].js'
            : '[name]/[name].[hash].js';
        },
        chunkFileNames: '[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name][extname]';
          }
          if (/\.(svg|png|jpg|jpeg|gif|webp)$/.test(assetInfo.name)) {
            return 'assets/images/[name][extname]';
          }
          if (extType === 'css') {
            return '[name]/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        }
      }
    }
  }
});
