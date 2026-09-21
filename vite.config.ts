import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig(() => {
  const certPath = path.resolve(__dirname, '192.168.1.125+2.pem');
  const keyPath = path.resolve(__dirname, '192.168.1.125+2-key.pem');

  const hasHttpsCert =
    fs.existsSync(certPath) &&
    fs.existsSync(keyPath);

  return {
      base: '/Sec-2027/',
      plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },

    server: {
      host: '0.0.0.0',
      port: 3000,

      ...(hasHttpsCert
        ? {
            https: {
              key: fs.readFileSync(keyPath),
              cert: fs.readFileSync(certPath),
            },
          }
        : {}),

      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

