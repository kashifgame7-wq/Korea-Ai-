import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { handleChat, handleEnhancePrompt, handleGenerateImage } from './server/api.ts';

function apiPlugin(): Plugin {
  return {
    name: 'korea-ai-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        let bodyStr = '';
        req.on('data', (chunk) => {
          bodyStr += chunk;
        });

        req.on('end', async () => {
          try {
            (req as any).body = bodyStr ? JSON.parse(bodyStr) : {};
          } catch {
            (req as any).body = {};
          }

          const customRes: any = res;
          customRes.status = function (code: number) {
            res.statusCode = code;
            return customRes;
          };
          customRes.json = function (data: any) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            return customRes;
          };

          const pathname = req.url?.split('?')[0];

          try {
            if (pathname === '/api/chat') {
              await handleChat(req as any, customRes);
            } else if (pathname === '/api/generate-image') {
              await handleGenerateImage(req as any, customRes);
            } else if (pathname === '/api/enhance-prompt') {
              await handleEnhancePrompt(req as any, customRes);
            } else {
              customRes.status(404).json({ error: 'Endpoint not found' });
            }
          } catch (err: any) {
            console.error('API Error in Vite middleware:', err);
            customRes.status(500).json({ error: err?.message || 'Server error' });
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      apiPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: '/',
          name: 'Korea AI - Chat & Fast Images',
          short_name: 'Korea AI',
          description:
            'Smart conversational AI and ultra-fast creative image generator with custom styles, prompt enhancement, and session history.',
          theme_color: '#131314',
          background_color: '#131314',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

