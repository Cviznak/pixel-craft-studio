// Vercel Serverless Function for /api/ai-image
export default async function handler(req: any, res: any) {
  try {
    const { prompt = 'pixel art', width = '512', height = '512', seed, apiKey } = req.query || {};
    const finalSeed = seed || Math.floor(Math.random() * 1000000).toString();

    let targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${finalSeed}&nologo=true`;
    if (apiKey) {
      targetUrl += `&key=${encodeURIComponent(apiKey)}`;
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const upstream = await fetch(targetUrl, { headers });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      res.status(upstream.status).json({
        status: upstream.status,
        message: errorText,
      });
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const arrayBuf = await upstream.arrayBuffer();
    res.status(200).send(Buffer.from(arrayBuf));
  } catch (err: unknown) {
    res.status(500).json({
      status: 500,
      message: err instanceof Error ? err.message : 'Internal Server Error',
    });
  }
}
