import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// npm run dev:https: bản https ở cổng 5174 cho ô "Liên kết" của LIVE Studio.
// Có chứng chỉ mkcert trong certs/ thì dùng (máy tin cậy, không cảnh báo); không thì tự ký.
export default defineConfig(({ mode }) => {
  const https = mode === 'https';
  const hasCert = existsSync('certs/cert.pem') && existsSync('certs/key.pem');
  return {
    // đường dẫn tương đối để bản build chạy được trong thư mục con của GitHub Pages
    base: './',
    plugins: https && !hasCert ? [react(), basicSsl()] : [react()],
    server: {
      port: https ? 5174 : 5173,
      open: false,
      host: true,
      https: https && hasCert ? { cert: readFileSync('certs/cert.pem'), key: readFileSync('certs/key.pem') } : undefined,
    },
  };
});
