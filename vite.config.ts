import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // ✅ './'로 설정하여 절대 경로(/)가 아닌 현재 위치 기준으로 파일을 찾게 합니다.
  base: './', 
  plugins: [react()],
  resolve: {
    alias: {
      // ✅ 별칭을 명확히 src로 지정합니다.
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // ✅ 빌드 시 이전 파일을 깨끗이 지웁니다.
    emptyOutDir: true,
    // ✅ 자산 파일 이름에 해시를 붙여 캐시 문제를 방지합니다.
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
