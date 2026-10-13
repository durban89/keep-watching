import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'KeepWatching',
    description:
      'Enjoy a cleaner, uninterrupted viewing experience on video sites.',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: [
      '*://*.youtube.com/*',
      '*://*.youtube-nocookie.com/*',
    ],
  },
});
