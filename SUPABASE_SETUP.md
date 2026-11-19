# Supabase Cloud Setup — Pixel Craft Studio (Wave 4)

Pixel Craft Studio works 100% offline in the browser by default. Connecting a dedicated **Supabase** project activates:

- **Live Community Feed & Short Share Links (`/p/:id`)** (both authenticated crafters and guest publishers)
- **Cloud Projects Vault Sync** across desktop, tablet, and phone
- **Cloud Stash, Favorites & WIP Timer Journal Sync**

Follow these **3 steps** to activate Wave 4 on your own Supabase project:

---

## Step 1: Create a Supabase Project & Run the Migration

1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and click **New Project**.
2. Wait ~1 minute for Postgres to initialize, then open **SQL Editor** in the left sidebar.
3. Paste the entire contents of [`supabase/migrations/20261119_wave4_community_and_cloud_sync.sql`](supabase/migrations/20261119_wave4_community_and_cloud_sync.sql) and click **Run**.

This creates 4 Row-Level-Security–protected tables (`published_patterns`, `pattern_likes`, `cloud_projects`, `user_cloud_preferences`) and explicit `anon` / `authenticated` API grants.

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

3. For **production (Vercel)**, open **Project Settings → Environment Variables** in Vercel (`pixel-craft-studio`), add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, and trigger a redeploy.

Once those two `VITE_*` variables are present, **Community Feed**, **`/p/:id` Short Share Links**, **Pattern Publishing**, **Cloud Vault Sync**, and **Cloud Stash / WIP Sync** activate automatically with zero extra code changes!
