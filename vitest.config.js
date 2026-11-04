import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false, // os dois arquivos de teste dividem o mesmo banco
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST
        ?? 'postgresql://postgres:senha@localhost:5432/pratocheio_test',
    },
  },
});
