import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'

function aiImageProxyPlugin(): Plugin {
  const handler = async (req: any, res: any) => {
    try {
      const parsedUrl = new URL(req.url || '', 'http://localhost');
      const prompt = parsedUrl.searchParams.get('prompt') || 'pixel art';
      const width = parsedUrl.searchParams.get('width') || '512';
      const height = parsedUrl.searchParams.get('height') || '512';
      const seed = parsedUrl.searchParams.get('seed') || Math.floor(Math.random() * 1000000).toString();
      const apiKey = parsedUrl.searchParams.get('apiKey') || '';

      let targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
      if (apiKey) {
        targetUrl += `&key=${encodeURIComponent(apiKey)}`;
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      // Node fetch does not send browser Origin, bypassing Cloudflare Turnstile
      const upstream = await fetch(targetUrl, { headers });

      if (!upstream.ok) {
        const errorText = await upstream.text();
        res.statusCode = upstream.status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({
          status: upstream.status,
          message: errorText,
        }));
        return;
      }

      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const arrayBuf = await upstream.arrayBuffer();
      res.end(Buffer.from(arrayBuf));
    } catch (err: unknown) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify({
        status: 500,
        message: err instanceof Error ? err.message : 'Internal Server Error',
      }));
    }
  };

  return {
    name: 'ai-image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai-image', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/ai-image', handler);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), aiImageProxyPlugin()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('html2canvas')) return 'vendor-html2canvas';
        },
      },
    },
  },
})
