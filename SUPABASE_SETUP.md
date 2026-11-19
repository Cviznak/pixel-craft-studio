# Supabase Cloud Setup — Pixel Craft Studio (Wave 4 & Wave 5)

Pixel Craft Studio works 100% offline in the browser by default. Connecting a dedicated **Supabase** project activates:

- **Live Community Feed, Creator Profiles, Remix Lineage, Build Tips & Short Share Links (`/p/:id`)**
- **Cloud Projects Vault Sync** across desktop, tablet, and phone
- **Cloud Stash, Favorites & WIP Timer Journal Sync**

Follow these **3 steps** to activate Cloud & Community features on your own Supabase project:

---

## Step 1: Create a Supabase Project & Run the Migrations

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Wait ~1 minute for Postgres to initialize, then open **SQL Editor** in the left sidebar.
3. Run [`20261119_wave4_community_and_cloud_sync.sql`](supabase/migrations/20261119_wave4_community_and_cloud_sync.sql) first, then run [`20261119_wave5_community_depth.sql`](supabase/migrations/20261119_wave5_community_depth.sql).

This creates 5 Row-Level-Security–protected tables (`published_patterns`, `pattern_likes`, `pattern_comments`, `cloud_projects`, `user_cloud_preferences`), remix lineage tracking, and explicit `anon` / `authenticated` API grants.

---

## Step 2: Configure Auth URLs (Magic Link + Email/Password)

1. In your Supabase project go to **Authentication → URL Configuration**.
2. Set **Site URL** to:
   `https://www.pixel-craft-studio.com`
3. Under **Redirect URLs**, add:
   - `https://www.pixel-craft-studio.com/**`
   - `http://localhost:5173/**`
4. Ensure **Email** provider is enabled under **Authentication → Sign In / Providers** (enabled by default in new Supabase projects).

---

## Step 3: Add Environment Variables (Local & Vercel)

1. In Supabase go to **Settings → API Keys** and copy:
   - **Project URL** (`https://<project-ref>.supabase.co`)
   - **Publishable key** (`sb_publishable_...`)
2. For **local development**, add them to `.env.local` (already gitignored — never commit secrets):

   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
   ```

3. For **production (Vercel)**, open **Project Settings → Environment Variables** in Vercel (`pixel-craft-studio`), add both public keys (Vercel's Marketplace integration also sets `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, both supported automatically by Vite), and trigger a redeploy.

Once connected, **Community Feed**, **`/p/:id` Short Share Links with dynamic OG image previews**, **Creator Profiles**, **Build Tips**, **Cloud Vault Sync**, and **Cloud Stash / WIP Sync** activate automatically!
