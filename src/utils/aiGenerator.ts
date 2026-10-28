export interface AiStyleOption {
  id: string;
  name: string;
  promptSuffix: string;
  icon: string;
  description: string;
}

export const AI_STYLE_PRESETS: AiStyleOption[] = [
  {
    id: 'pixel-art',
    name: 'Retro Pixel Art',
    promptSuffix: ', 16-bit pixel art style, clean outlines, vibrant game sprite aesthetic, crisp colors, solid background, high quality pixel art',
    icon: '👾',
    description: 'Perfect for beadcraft and retro game patterns',
  },
  {
    id: 'sticker',
    name: 'Vibrant Vector Sticker',
    promptSuffix: ', cute vector sticker art, bold smooth outlines, solid vibrant colors, white border, flat shading, high contrast, clean minimalist background',
    icon: '🏷️',
    description: 'Crisp distinct shapes, ideal for cross-stitch & Perler',
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass Art',
    promptSuffix: ', vibrant stained glass window art, luminous translucent jewel tones, bold black lead lines, highly saturated radiant colors, mosaic pattern',
    icon: '✨',
    description: 'Incredible glowing jewel tones and defined segments',
  },
  {
    id: 'kawaii',
    name: 'Kawaii Chibi Art',
    promptSuffix: ', adorable kawaii chibi style, pastel and vibrant cheerful colors, cute big expressive eyes, simple charming shapes, clean soft background',
    icon: '💖',
    description: 'Ultra cute characters, animals and food',
  },
  {
    id: 'botanical',
    name: 'Vibrant Botanical',
    promptSuffix: ', vibrant botanical illustration, rich emerald green leaves, colorful vivid flower petals, clean lighting, high aesthetic harmony, detailed nature art',
    icon: '🌺',
    description: 'Rich florals, lush plants and tropical colors',
  },
  {
    id: 'fantasy',
    name: 'Fantasy RPG Icon',
    promptSuffix: ', vibrant fantasy RPG item icon, magical glowing details, rich saturated palette, clean border, crystal clear composition',
    icon: '🔮',
    description: 'Magical crystals, potions, enchanted artifacts',
  },
  {
    id: 'clean',
    name: 'Original / Raw Prompt',
    promptSuffix: ', high quality, vibrant colors, clear subject',
    icon: '🎨',
    description: 'Uses your prompt directly without style modifiers',
  },
];

export const INSPIRATION_PROMPTS = [
  'A cute chubby orange cat wearing a tiny strawberry hat',
  'Magical glowing mushroom house in an enchanted fairy forest',
  'Synthwave retro sunset with neon sun, mountains and palm trees',
  'Vibrant tropical parrot perched on blooming hibiscus branch',
  'Cute baby dragon hugging a sparkling sapphire gemstone',
  'Japanese ramen bowl with smiling egg, noodles and chopsticks',
  'Whimsical celestial moon and sun with golden stars and clouds',
  'Sparkling iridescent crystal butterfly with delicate wings',
];

export interface GenerateImageOptions {
  prompt: string;
  styleId?: string;
  width?: number;
  height?: number;
  seed?: number;
  apiKey?: string;
}

export interface GenerationError {
  isRateLimit?: boolean;
  retryAfterSeconds?: number;
  message: string;
}

/**
 * Generate an image via AI from a text prompt and return clean Base64 Data URL.
 * Routes through local Vite proxy (/api/ai-image) to bypass Cloudflare Turnstile blocks.
 */
export async function generateImageFromPrompt({
  prompt,
  styleId = 'pixel-art',
  width = 512,
  height = 512,
  seed = Math.floor(Math.random() * 1000000),
  apiKey = '',
}: GenerateImageOptions): Promise<string> {
  const selectedStyle = AI_STYLE_PRESETS.find((s) => s.id === styleId) || AI_STYLE_PRESETS[0];
  const fullPrompt = `${prompt.trim()}${selectedStyle.promptSuffix}`;

  // Call same-origin local proxy to bypass Cloudflare Turnstile 403
  const encodedPrompt = encodeURIComponent(fullPrompt);
  let proxyUrl = `/api/ai-image?prompt=${encodedPrompt}&width=${width}&height=${height}&seed=${seed}`;
  if (apiKey) {
    proxyUrl += `&apiKey=${encodeURIComponent(apiKey)}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const response = await fetch(proxyUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let rawText = '';
      try {
        const json = await response.json();
        rawText = typeof json === 'string' ? json : JSON.stringify(json);
      } catch {
        rawText = await response.text();
      }

      // Check for rate limit
      if (response.status === 402 || rawText.includes('FREE_LIMIT') || rawText.includes('45 seconds')) {
        // Try to parse "Retry after Xs"
        const match = rawText.match(/Retry after (\d+)s/i);
        const retrySec = match ? parseInt(match[1], 10) : 30;
        const err: Error & GenerationError = new Error(
          `Free generation limit reached (1 image per 45s). Please wait ${retrySec} seconds before your next generation.`
        );
        err.isRateLimit = true;
        err.retryAfterSeconds = retrySec;
        throw err;
      }

      if (response.status === 404) {
        // Static host without /api backend (e.g. GitHub Pages) - fallback to direct load
        const directUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&nologo=true`;
        return await loadDirectImageAsDataUrl(directUrl);
      }

      if (response.status === 403) {
        throw new Error('Access denied by upstream image provider. Please try again in a few moments.');
      }

      throw new Error(`AI generation service error (${response.status}): ${rawText.slice(0, 150)}`);
    }

    const blob = await response.blob();

    // Convert blob to Base64 data URL so canvas getImageData is 100% untainted and reliable
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert generated image to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error while reading blob'));
      reader.readAsDataURL(blob);
    });
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Image generation timed out after 45s. Please try a simpler prompt or retry.');
    }
    throw err;
  }
}

async function loadDirectImageAsDataUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 512;
        canvas.height = img.naturalHeight || 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get 2d context');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => reject(new Error('Could not load image from fallback.'));
    img.src = url;
  });
}

