import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Scissors, Sparkles, X } from 'lucide-react';

interface PageShellProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { label: 'Community', to: '/community' },
  { label: '.OXS Viewer', to: '/oxs-viewer' },
  { label: 'Color Substitutor', to: '/tools/color-substitutor' },
  { label: 'Color Charts', to: '/color-chart' },
  { label: 'Calculators', to: '/calculators' },
];

export const PageShell: React.FC<PageShellProps> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActivePath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <div className="flex-1 min-h-0 w-full overflow-y-auto bg-[#090d16] text-slate-200 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-indigo-600 to-amber-400 p-[1.5px] shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Scissors className="w-4 h-4 text-pink-400 group-hover:scale-110 transition" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">
                Pixel Craft Studio
              </span>
              <span className="hidden sm:inline text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Free Suite
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            <Link
              to="/cross-stitch"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:to-pink-500 shadow-lg shadow-indigo-600/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Studio</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-slate-800/80 bg-slate-950 px-4 py-3 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    active
                      ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {children}
      </main>

      {/* Site Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-xs">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-white text-sm">
              <Scissors className="w-4 h-4 text-pink-400" />
              <span>Pixel Craft Studio</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Free browser-based pattern designer, `.OXS` converter, and thread/bead color matching studio for fiber &amp; bead artists.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Craft Studios
            </h3>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/cross-stitch" className="hover:text-white transition">Cross-Stitch Maker</Link></li>
              <li><Link to="/crochet" className="hover:text-white transition">Tapestry Crochet &amp; C2C</Link></li>
              <li><Link to="/knitting" className="hover:text-white transition">Intarsia &amp; Fair Isle Knitting</Link></li>
              <li><Link to="/perler-beads" className="hover:text-white transition">Perler &amp; Fuse Beads</Link></li>
              <li><Link to="/loom-beading" className="hover:text-white transition">Miyuki Bead Loom &amp; Peyote</Link></li>
              <li><Link to="/alpha-keychain" className="hover:text-white transition">Alpha Bracelet &amp; Keychains</Link></li>
              <li><Link to="/diamond-painting" className="hover:text-white transition">Diamond Painting</Link></li>
              <li><Link to="/pixel-art" className="hover:text-white transition">Pixel Art Studio</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Free Craft Tools
            </h3>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/oxs-viewer" className="hover:text-white transition">.OXS Pattern Viewer &amp; Converter</Link></li>
              <li><Link to="/tools/color-substitutor" className="hover:text-white transition">Batch Color Substitutor &amp; Blends</Link></li>
              <li><Link to="/color-chart" className="hover:text-white transition">CIELAB Color Charts &amp; Hex Match</Link></li>
              <li><Link to="/calculators" className="hover:text-white transition">Floss, Bead &amp; C2C Calculators</Link></li>
              <li><Link to="/community" className="hover:text-white transition">Community Pattern Showcase</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition">Curated Starter Gallery</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
              Info &amp; Trust
            </h3>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link to="/about" className="hover:text-white transition">About Pixel Craft Studio</Link></li>
              <li><Link to="/license" className="hover:text-white transition">Commercial &amp; Etsy Seller License</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy &amp; Local Storage</Link></li>
            </ul>
            <p className="pt-2 text-[11px] text-slate-500">
              100% browser-first pattern generation. No watermarks, no subscriptions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
