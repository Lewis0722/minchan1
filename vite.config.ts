import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 배포 환경에서 index.css, favicon 등을 찾지 못하는 404 에러를 해결합니다.
  base: '/', 

  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  plugins: [react()],

  resolve: {
    alias: {
      // 2. '@' 경로가 프로젝트 루트를 가리키도록 설정합니다.
      '@': path.resolve(__dirname, '.'),
    }
  },

  build: {
    // 3. 빌드 결과물이 Vercel에서 인식하는 표준 폴더인 dist에 생성되도록 합니다.
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 배포용이므로 용량을 위해 끕니다.
  }
});
