import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Database,
  FileCode2,
  Heart,
  Lock,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { STANDALONE_PAGE_ROUTES, updateDocumentMeta } from '../utils/craftRoutes';

interface TrustInfoPageProps {
  page: 'about' | 'license' | 'privacy';
}

export const TrustInfoPage: React.FC<TrustInfoPageProps> = ({ page }) => {
  useEffect(() => {
    const meta = STANDALONE_PAGE_ROUTES[`/${page}`];
    updateDocumentMeta(meta, null);
  }, [page]);

  return (
    <PageShell>
      {/* Top Sub-Navigation */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <Link
          to="/about"
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
            page === 'about'
              ? 'bg-indigo-600 text-white border-indigo-500'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          About Studio
        </Link>
        <Link
          to="/license"
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
            page === 'license'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          Commercial &amp; Etsy License
        </Link>
        <Link
          to="/privacy"
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
            page === 'privacy'
              ? 'bg-cyan-600 text-white border-cyan-500'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
          }`}
        >
          Privacy &amp; Data Architecture
        </Link>
      </div>

      {page === 'about' && (
        <div className="space-y-8 max-w-4xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Craft Pattern &amp; Color Engineering</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for Stitchers, Crocheters, Knitters &amp; Bead Artists
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pixel Craft Studio started with a simple goal: give fiber and bead crafters accurate, print-ready charts — with perceptual CIELAB color matching, real physical gauges, and open file formats — directly in the browser without paywalls or watermarks.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white">8 Dedicated Craft Simulators</h2>
              <p className="text-slate-400 leading-relaxed">
                From 4:5 rectangular Stockinette Knitting gauges and staggered Miyuki Delica Peyote/Brick looms to 29×29 Perler pegboards, Alpha keychains, Tapestry/C2C Crochet, Diamond Painting, Cross-Stitch with backstitch vectors, and freehand Pixel Art.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white">Open Interoperable Standards</h2>
              <p className="text-slate-400 leading-relaxed">
                Never get locked into a proprietary subscription viewer. Import and export industry-standard <code className="text-emerald-300 font-mono">.oxs</code> XML charts, Pattern Keeper vector PDFs, layered `.svg` files, and portable JSON backups.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white">CIELAB ΔE Perceptual Matching</h2>
              <p className="text-slate-400 leading-relaxed">
                Instead of naive RGB distance, our palette quantizer and color substitutor match floss and bead shades in human-perceptual CIELAB color space so skin tones, foliage, and gradients stay true to life.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white">Ready to Start Crafting?</h2>
              <p className="text-slate-400 leading-relaxed">
                Explore patterns shared by fellow makers in the Community Showcase or open the interactive Studio right away.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Link
                  to="/cross-stitch"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
                >
                  Open Studio
                </Link>
                <Link
                  to="/community"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
                >
                  Browse Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'license' && (
        <div className="space-y-6 max-w-4xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Clear Creator &amp; Etsy Seller Terms</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Commercial &amp; Etsy Seller License
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              We believe artists should keep full creative control over the patterns they design.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/30 p-5 space-y-2.5">
              <h2 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Commercial Rights to Your Original Designs</span>
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Any original pattern, PDF booklet, Pattern Keeper chart, `.oxs` file, layered `.svg`, or Etsy Seller Listing Kit generated from your own artwork, original photographs, or drawings in Pixel Craft Studio is yours to use freely — for personal stitching, craft fairs, blog freebies, or selling digital PDFs on Etsy, Shopify, and Ko-fi with zero royalties or attribution required.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>Community Remixes &amp; Third-Party Copyrights</span>
              </h2>
              <ul className="space-y-2 text-slate-400 list-disc list-inside leading-relaxed">
                <li>
                  <strong className="text-slate-200">User-Published Community Patterns:</strong> Patterns shared publicly on `/community` are meant for personal crafting and non-commercial community remixing unless the original creator explicitly grants commercial permission.
                </li>
                <li>
                  <strong className="text-slate-200">Uploaded Photos &amp; Artwork:</strong> You are responsible for ensuring any reference photo or `.oxs` chart you upload or sell does not infringe another artist&apos;s copyright or fan-art restrictions.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span>Brand Trademarks &amp; Affiliate Disclosure</span>
              </h2>
              <p className="text-slate-400 leading-relaxed">
                DMC, Anchor, Perler, Artkal, Hama, Miyuki Delica, Pattern Keeper, WinStitch, and Etsy are trademarks of their respective owners and are referenced strictly for craft color-matching and file interoperability. Optional outbound shopping links in Supply Kit &amp; Material Checklists may include affiliate links that help support keeping Pixel Craft Studio free.
              </p>
            </div>
          </div>
        </div>
      )}

      {page === 'privacy' && (
        <div className="space-y-6 max-w-4xl">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Local-First Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Privacy Policy &amp; Data Handling
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pixel Craft Studio processes patterns directly in your browser wherever possible. Here is a transparent summary of what stays on your device vs. what touches a server.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>What Stays 100% On Your Device</span>
              </h2>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside leading-relaxed">
                <li>Uploaded reference photos during pixelation &amp; background removal</li>
                <li>`.oxs`, `.json`, `.pixelcraft`, PDF, PNG, and `.svg` exports</li>
                <li>Auto-saved canvas workspace, Projects Vault, personal DMC/Perler Stash, and WIP Timer logs (stored in IndexedDB &amp; localStorage)</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 space-y-2">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Optional Cloud Features &amp; Analytics</span>
              </h2>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside leading-relaxed">
                <li><strong className="text-slate-200">Optional Cloud Sync:</strong> Only when you explicitly sign in with Supabase Auth are your synced vault projects, stash preferences, or published `/p/:id` patterns stored in PostgreSQL with Row-Level Security.</li>
                <li><strong className="text-slate-200">AI Image Generator:</strong> Only text prompts you submit in the AI modal are sent to our image generation endpoint.</li>
                <li><strong className="text-slate-200">Analytics:</strong> Lightweight, privacy-friendly Vercel Analytics measures aggregate page performance without invasive ad-network tracking.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};
