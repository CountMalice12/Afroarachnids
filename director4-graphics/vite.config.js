import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        tactical: fileURLToPath(new URL('./index.html', import.meta.url)),
        orbital: fileURLToPath(new URL('./flight.html', import.meta.url)),
        palace: fileURLToPath(new URL('./palace.html', import.meta.url))
      }
    }
  }
});
