/*
# Blog Platform Schema — Profiles, Posts, Comments, Likes

## Overview
Full multi-user blog platform with authentication, posts (draft/published), comments, and likes.
Uses Supabase Auth (auth.users) for authentication. All tables have RLS enabled with
ownership-scoped policies.

## New Tables

### profiles
- id (uuid, PK, references auth.users) — one row per user
- name (text) — display name
- bio (text) — user bio
- avatar_url (text) — profile picture URL
- created_at (timestamptz)

### posts
- id (uuid, PK)
- title (text)
- slug (text, unique) — SEO-friendly URL
- content (text) — markdown content
- excerpt (text) — auto-generated or manual summary
- cover_image_url (text)
- tags (text[]) — array of category/tag strings
- status (text) — 'draft' or 'published'
- author_id (uuid, references profiles, default auth.uid())
- created_at, updated_at (timestamptz)

### comments
- id (uuid, PK)
- content (text)
- post_id (uuid, references posts, cascade delete)
- author_id (uuid, references profiles, default auth.uid())
- parent_id (uuid, references comments, nullable) — for threaded replies
- created_at, updated_at (timestamptz)

### post_likes
- id (uuid, PK)
- post_id (uuid, references posts, cascade delete)
- user_id (uuid, references auth.users, default auth.uid())
- created_at (timestamptz)
- unique(post_id, user_id) — one like per user per post

## Security
- RLS enabled on all tables.
- Published posts: readable by anon + authenticated (public blog).
- Draft posts: only author can SELECT.
- Posts: author-only INSERT/UPDATE/DELETE (via auth.uid() = author_id).
- Comments: public SELECT (anyone can read comments on published posts), authenticated INSERT,
  author-only UPDATE, comment-author OR post-author DELETE.
- Likes: authenticated can read all likes, authenticated can like/unlike their own likes.
- Profiles: public SELECT (author info display), self-only UPDATE/INSERT.

## Notes
1. A trigger function handles automatic slug generation from title on insert if slug is null.
2. Profiles table is auto-populated via a trigger on auth.users insert (handle_new_user).
3. Comment deletion allows post author to delete any comment on their post.
*/

-- ============================================================
-- PROFILES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view profiles" ON profiles;
CREATE POLICY "Public can view profiles"
  ON profiles FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- POSTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE,
  content text NOT NULL DEFAULT '',
  excerpt text DEFAULT '',
  cover_image_url text DEFAULT '',
  tags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Published posts are public; drafts only visible to author
DROP POLICY IF EXISTS "select_posts" ON posts;
CREATE POLICY "select_posts"
  ON posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR auth.uid() = author_id);

DROP POLICY IF EXISTS "insert_own_posts" ON posts;
CREATE POLICY "insert_own_posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "update_own_posts" ON posts;
CREATE POLICY "update_own_posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "delete_own_posts" ON posts;
CREATE POLICY "delete_own_posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Auto-generate slug and excerpt, update updated_at
CREATE OR REPLACE FUNCTION public.handle_post_insert_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_slug text;
  new_slug text;
  counter int := 0;
BEGIN
  -- Generate slug on INSERT if null or empty
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g'));
      base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
      IF base_slug = '' THEN
        base_slug := 'untitled';
      END IF;
      new_slug := base_slug;
      LOOP
        EXIT WHEN NOT EXISTS (SELECT 1 FROM posts WHERE slug = new_slug AND id != NEW.id);
        counter := counter + 1;
        new_slug := base_slug || '-' || counter;
      END LOOP;
      NEW.slug := new_slug;
    END IF;
  END IF;

  -- Auto-generate excerpt if empty
  IF (NEW.excerpt IS NULL OR NEW.excerpt = '') AND NEW.content != '' THEN
    NEW.excerpt := left(regexp_replace(NEW.content, '[#*`>\-\\[\\]]', '', 'g'), 200);
  END IF;

  -- Update updated_at on UPDATE
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_post_insert ON posts;
CREATE TRIGGER on_post_insert
  BEFORE INSERT ON posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_insert_update();

DROP TRIGGER IF EXISTS on_post_update ON posts;
CREATE TRIGGER on_post_update
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_insert_update();

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_posts_status_created ON posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Comments on published posts are public; comments on drafts visible to post author
DROP POLICY IF EXISTS "select_comments" ON comments;
CREATE POLICY "select_comments"
  ON comments FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND (posts.status = 'published' OR posts.author_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "insert_own_comments" ON comments;
CREATE POLICY "insert_own_comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Only comment author can edit their comment
DROP POLICY IF EXISTS "update_own_comments" ON comments;
CREATE POLICY "update_own_comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Comment author OR post author can delete
DROP POLICY IF EXISTS "delete_comments" ON comments;
CREATE POLICY "delete_comments"
  ON comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.author_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ============================================================
-- POST_LIKES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_likes" ON post_likes;
CREATE POLICY "select_likes"
  ON post_likes FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_own_like" ON post_likes;
CREATE POLICY "insert_own_like"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_like" ON post_likes;
CREATE POLICY "delete_own_like"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON post_likes(user_id);

-- Grant access to trigger functions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON profiles TO anon, authenticated;
GRANT SELECT ON posts TO anon, authenticated;
GRANT SELECT ON comments TO anon, authenticated;
GRANT SELECT ON post_likes TO anon, authenticated;