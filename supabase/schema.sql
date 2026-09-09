-- ==============================================================================
-- "Our Space" — Supabase Database Schema & Row Level Security (RLS)
-- ==============================================================================
-- Instructions:
-- 1. In your Supabase Dashboard, go to the SQL Editor.
-- 2. Paste this entire script and click "Run".
-- 3. In Authentication > Users, create the two accounts for you and your girlfriend.
-- ==============================================================================

-- 1. Profiles Table (Holds display name, avatar, and references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'My Love',
  avatar_emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Authenticated users can read all profiles (just the two of you)
-- and update only their own profile.
CREATE POLICY "Allow authenticated users to read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);


-- 2. Game State Table (For realtime Tic-Tac-Toe)
-- Uses a single shared row id = 'tictactoe-main' so both players play on the same live board.
CREATE TABLE IF NOT EXISTS public.game_state (
  id TEXT PRIMARY KEY,
  board JSONB NOT NULL DEFAULT '["", "", "", "", "", "", "", "", ""]'::jsonb,
  current_turn TEXT NOT NULL DEFAULT 'X',
  player_x_id UUID REFERENCES auth.users(id),
  player_o_id UUID REFERENCES auth.users(id),
  winner TEXT DEFAULT NULL, -- 'X', 'O', 'draw', or null
  winning_line JSONB DEFAULT NULL, -- e.g. [0, 1, 2]
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on game_state
ALTER TABLE public.game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view game state"
  ON public.game_state FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update game state"
  ON public.game_state FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert game state"
  ON public.game_state FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Seed initial game row
INSERT INTO public.game_state (id, board, current_turn, winner)
VALUES ('tictactoe-main', '["", "", "", "", "", "", "", "", ""]'::jsonb, 'X', NULL)
ON CONFLICT (id) DO NOTHING;


-- 3. Daily Question Answers Table
CREATE TABLE IF NOT EXISTS public.daily_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_user_daily_answer UNIQUE (date, user_id)
);

-- Enable RLS on daily_answers
ALTER TABLE public.daily_answers ENABLE ROW LEVEL SECURITY;

-- Users can insert and update their own answers
CREATE POLICY "Allow users to insert own daily answer"
  ON public.daily_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own daily answer"
  ON public.daily_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Read policy: Both users can view answers for a given date once BOTH have answered,
-- OR a user can always view their own answer for that date.
CREATE POLICY "Allow users to read answers if both have submitted or if it is their own"
  ON public.daily_answers FOR SELECT
  TO authenticated
  USING (
    -- You can always see your own answers
    auth.uid() = user_id
    OR
    -- Or you can see partner's answer only if you have also submitted for that date!
    EXISTS (
      SELECT 1 FROM public.daily_answers my_answer
      WHERE my_answer.date = daily_answers.date
        AND my_answer.user_id = auth.uid()
    )
  );


-- 4. Enable Supabase Realtime for game_state and daily_answers
-- This allows websocket subscriptions on changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_answers;
