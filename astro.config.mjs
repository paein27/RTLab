// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import site from './src/data/site.json' with { type: 'json' };

export default defineConfig({
  // URL pública del sitio (se define en src/data/site.json → siteUrl).
  site: site.siteUrl,
  base: '/',
  output: 'static',
  integrations: [
    // Los estilos base de Tailwind se cargan desde src/styles/global.css
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
