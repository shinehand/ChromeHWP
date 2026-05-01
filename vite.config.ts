import { defineConfig } from 'vite';
import type { Plugin } from 'vite';

import manifest from './src/manifest';

function writeExtensionManifest(): Plugin {
  return {
    name: 'write-extension-manifest',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: `${JSON.stringify(manifest, null, 2)}\n`
      });
    }
  };
}

export default defineConfig({
  plugins: [writeExtensionManifest()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: 'src/popup/popup.html',
        options: 'src/options/options.html',
        editor: 'src/editor/editor.html',
        'service-worker': 'src/background/service-worker.ts'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false
  }
});
