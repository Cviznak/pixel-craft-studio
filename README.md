# Pixel Craft Studio 🧵🔘💎

> Free online pattern maker to **convert images to pixel art**, **Perler bead patterns**, **cross-stitch charts**, and **diamond painting designs** with official DMC floss codes and real-world dimensions.

🌐 **Live Website**: [https://pixel-craft-studio.com](https://pixel-craft-studio.com)

![Pixel Craft Studio](https://img.shields.io/badge/Status-Production%20Ready-emerald?style=flat-square)
![Build](https://img.shields.io/badge/Build-Passing-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

---

## ✨ Features

- **Photo Upload & Instant Samples**: Drag & drop your own photos or pick from built-in vibrant botanical, animal, and synthwave artwork.
- **AI Picture Studio (Prompt to Picture)**: Generate custom craft subjects using text prompts with craft-tailored style presets (*16-bit Pixel Art, Vector Sticker, Stained Glass, Kawaii, Botanical, RPG Icon*).
- **Generation History**: Browse all past AI generations with text prompts and photos. Reuse prompts or load any past picture with one click.
- **Image Inspector Lightbox**: Inspect your generated or source pictures in high resolution with pan, zoom, prompt details, and an "Open in New Tab" option.
- **"Most Beautiful Colors" Palette Engine**: CIELAB K-Means++ perceptual clustering with chroma and saturation weighting to prioritize striking jewel tones and prevent dull muddy colors.
- **Official Craft Thread/Bead Codes**: Matches extracted colors directly to official **DMC Embroidery Floss codes** and **Perler Bead codes**.
- **Realistic Craft Simulation**:
  - 🔘 **Perler Beads**: 3D beads with pegboard holes and glossy shine.
  - 🧵 **Cross-Stitch**: Realistic thread 'X' stitches on natural Aida linen cloth.
  - 💎 **Diamond Painting**: Sparkly faceted square/round drills.
  - 🔲 **Classic Pixel Art**: Clean retro squares.
- **Interactive Canvas Tools**:
  - ✏️ **Pixel Pencil with Undo / Redo**: Touch up any pixel on the grid with full `Ctrl+Z` (Undo) and `Ctrl+Y` / `Ctrl+Shift+Z` (Redo) support.
  - 🎯 **Color Spotlight Mode**: Click the eye icon next to any color in the shopping list to isolate only those cells on the grid.
  - ✅ **Craft Tracker**: Check off completed beads or stitches as you craft, with live completion percentages and confetti celebration upon finishing!
  - 🔍 **Smooth Zoom & Pan**: Dedicated non-passive touchpad and mouse controls without altering the browser page zoom.
- **Printable Pattern & Export**:
  - 🖨️ **Printable Craft Chart (PDF)**: 10×10 numbered grid lines, symbols, and a complete material shopping list.
  - 🖼️ **Symbol Chart PNG**: High-resolution chart with coordinate rulers.
  - 🎨 **Clean Pixel Art PNG**: Scaled lossless export (8x, 16x, 24x).
  - 💾 **Project JSON Save & Load**: Save and resume your work anytime.
- **Automatic State Persistence**: Automatically preserves your active project, custom pixel edits, palette adjustments, craft tracker progress, and AI generation history in **IndexedDB**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | **Undo** pencil stroke |
| `Ctrl + Y` / `Ctrl + Shift + Z` | **Redo** pencil stroke |
| `Mouse Wheel` / `Pinch` | Zoom canvas in / out |
| `Space + Drag` / `Middle-Click Drag` | Pan canvas viewport |
| `Esc` | Close open modal / inspect lightbox |

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173/` in your browser.

---

## 🌐 Hosting on the Internet

This repository is optimized for internet hosting on any cloud provider or static web host.

### Option 1: Deploy to Vercel (Recommended)
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. The included [`vercel.json`](./vercel.json) and serverless function [`api/ai-image.ts`](./api/ai-image.ts) work automatically with zero configuration.

### Option 2: Deploy to Netlify
1. Connect the repository in [Netlify](https://www.netlify.com).
2. The included [`netlify.toml`](./netlify.toml) automatically sets the build command (`npm run build`) and publish directory (`dist`).

### Option 3: GitHub Pages / Cloudflare Pages / Static Hosting
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. The `dist/` directory contains standard HTML, CSS, and JavaScript with relative asset paths (`base: './'`).
3. Deploy the contents of `dist/` to GitHub Pages, Cloudflare Pages, Firebase Hosting, or Amazon S3. The app includes automatic client-side fallbacks for static hosting environments.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Exporting**: jsPDF, Canvas Confetti
- **Storage**: IndexedDB with LocalStorage fallback
