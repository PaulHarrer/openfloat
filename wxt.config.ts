import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  manifest: {
    name: 'OpenFloat',
    description: "Adds PiP (Picture-in-Picture) toggle to sites that don't support it natively.",
    version: '1.1.0',
    author: 'Paul Harrer',
    icons: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
  },
});
