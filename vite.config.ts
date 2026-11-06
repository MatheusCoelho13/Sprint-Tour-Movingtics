import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS: WebXR e getUserMedia exigem secure context ao acessar via IP da rede (Quest/celular).
export default defineConfig({ plugins: [basicSsl()] })
