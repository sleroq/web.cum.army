import { defineConfig, loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const ReactCompilerConfig = {
  target: '19',
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react({
        babel: {
          plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
        },
      }),
      tailwindcss(),
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(/%VITE_SITE_TITLE%/g, env.VITE_SITE_TITLE || 'Broadcast Box');
        },
      },
    ],
    css: {
      postcss: './postcss.config.js',
    },
    build: {
      outDir: 'build',
    },
    server: {
      open: true, // Opens browser on dev server start
    },
    // For backwards compatibility
    envPrefix: ['REACT_', 'VITE_'],
  };
});
