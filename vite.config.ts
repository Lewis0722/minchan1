import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  // 1. 배포 시 index.css 등 자산을 찾지 못하는 404 에러를 방지하기 위해 base 경로를 설정합니다.
  base: '/', 

  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  plugins: [react()],

  // 2. 환경 변수 처리: 
  // 기존의 define 방식은 보안상 위험할 수 있으므로 제거하고, 
  // 대신 서비스 코드(geminiService.ts)에서 import.meta.env를 사용하도록 권장합니다.
  
  resolve: {
    alias: {
      // 3. '@'를 src 폴더로 연결하여 경로 관리를 편하게 합니다.
      '@': path.resolve(__dirname, './src'),
    }
  },

  build: {
    // 4. 빌드 결과물이 dist 폴더에 생성되도록 명시합니다.
    outDir: 'dist',
    assetsDir: 'assets',
    // 빌드 시 에러 로그를 더 자세히 보기 위한 설정
    sourcemap: true,
  }
});
