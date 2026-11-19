import React, { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const StudioApp = lazy(() => import('./App'));
const OxsViewerPage = lazy(() =>
  import('./pages/OxsViewerPage').then((m) => ({ default: m.OxsViewerPage }))
);
const ColorSubstitutorPage = lazy(() =>
  import('./pages/ColorSubstitutorPage').then((m) => ({
    default: m.ColorSubstitutorPage,
  }))
);
const CommunityHubPage = lazy(() =>
  import('./pages/CommunityHubPage').then((m) => ({
    default: m.CommunityHubPage,
  }))
);
const CreatorProfilePage = lazy(() =>
  import('./pages/CreatorProfilePage').then((m) => ({
    default: m.CreatorProfilePage,
  }))
);
const TrustInfoPage = lazy(() =>
  import('./pages/TrustInfoPage').then((m) => ({
    default: m.TrustInfoPage,
  }))
);

const PageLoader: React.FC = () => (
  <div className="flex-1 min-h-0 w-full bg-[#090d16] flex items-center justify-center text-slate-400 text-xs font-medium">
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800">
      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
      <span>Loading Pixel Craft Studio...</span>
    </div>
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/oxs-viewer" element={<OxsViewerPage />} />
        <Route path="/tools/color-substitutor" element={<ColorSubstitutorPage />} />
        <Route path="/community" element={<CommunityHubPage />} />
        <Route path="/u/:handle" element={<CreatorProfilePage />} />
        <Route path="/about" element={<TrustInfoPage page="about" />} />
        <Route path="/license" element={<TrustInfoPage page="license" />} />
        <Route path="/privacy" element={<TrustInfoPage page="privacy" />} />
        <Route path="/*" element={<StudioApp />} />
      </Routes>
    </Suspense>
  );
};
