const fs = require('fs');
const path = require('path');
const { defineConfig } = require('vite');
const basicSsl = require('@vitejs/plugin-basic-ssl');

function loadHttpsConfig() {
  const certFromEnv = process.env.SSL_CRT_FILE;
  const keyFromEnv = process.env.SSL_KEY_FILE;
  const defaultCert = path.resolve(__dirname, 'certs', 'dev.crt');
  const defaultKey = path.resolve(__dirname, 'certs', 'dev.key');

  const certPath = certFromEnv && fs.existsSync(certFromEnv) ? certFromEnv : (fs.existsSync(defaultCert) ? defaultCert : null);
  const keyPath = keyFromEnv && fs.existsSync(keyFromEnv) ? keyFromEnv : (fs.existsSync(defaultKey) ? defaultKey : null);

  if (certPath && keyPath) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  return false; // no https if certs not present
}

module.exports = defineConfig({
  plugins: [require('@vitejs/plugin-react')(), basicSsl()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // If cert files are present use them; basic-ssl already enables HTTPS otherwise
    https: loadHttpsConfig() || true,
    proxy: {
      // Route frontend requests to the backend to avoid mixed content in HTTPS
      '/api': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://10.10.108.210:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://10.10.108.210:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
