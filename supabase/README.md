# Supabase Setup Guide for "Our Space"

Follow these 4 quick steps in your [Supabase Dashboard](https://supabase.com/dashboard) to connect your live backend:

### Step 1: Create a Supabase Project
1. Go to [database.new](https://database.new) and create a new project (e.g. named `our-space`).
2. Choose a region close to both of you and set a database password.

### Step 2: Run the Database Schema
1. In your project dashboard, click on the **SQL Editor** tab in the left sidebar.
2. Click **New Query**.
3. Copy the entire contents of [`supabase/schema.sql`](./schema.sql) and paste it into the editor.
4. Click **Run** (or press Ctrl/Cmd + Enter).
   - This creates `profiles`, `game_state`, `daily_answers`, sets up Row Level Security (RLS), and enables Realtime broadcast.

### Step 3: Create the 2 User Accounts
Since registration is private with no public signup:
1. Go to **Authentication** > **Users** in the left sidebar.
2. Click **Add User** > **Create User**.
3. Create the first user:
   - Email: `your_email@example.com`
   - Password: `your-secure-password`
   - Toggle "Auto Confirm User" to ON so no email verification is needed.
4. Repeat to create the second user for your partner:
   - Email: `partner_email@example.com`
   - Password: `partner-secure-password`
   - Auto Confirm: ON.

### Step 4: Configure Environment Variables
1. In your Supabase Dashboard, go to **Project Settings** (gear icon) > **API**.
2. Find:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon public API Key** (`eyJhbGciOi...`)
3. In your local project folder, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
5. When deploying to Vercel, add those same 2 variables in your Vercel Project Settings under **Environment Variables**.
