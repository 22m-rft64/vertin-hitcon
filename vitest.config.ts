import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@adapters': path.resolve(__dirname, 'src/adapters'),
      '@services': path.resolve(__dirname, 'src/core/services'),
      '@ports': path.resolve(__dirname, 'src/core/ports'),
      '@commands': path.resolve(__dirname, 'src/commands'),
      '@discordtypes': path.resolve(__dirname, 'src/utils/types'),
      '@discordutils': path.resolve(__dirname, 'src/utils'),
      '@handlers': path.resolve(__dirname, 'src/handlers'),
      '@events': path.resolve(__dirname, 'src/events'),
      '@i18n': path.resolve(__dirname, 'src/i18n'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
