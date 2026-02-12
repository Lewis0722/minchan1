import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // ✅ 배포 시 자산 경로를 현재 폴더 기준으로 설정하여 404를 방지합니다.
  base: './', 
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ @ 별칭이 src 폴더를 정확히 가리키도록 설정합니다.
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // ✅ 빌드 시 이전 잔여 파일을 삭제하여 꼬임 현상을 방지합니다.
    emptyOutDir: true,
  },
});
