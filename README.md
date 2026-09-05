# Inkwell Blog Platform

Inkwell is a responsive, full-stack blog application built with React, Vite, TypeScript, and Supabase. It includes password authentication, author-owned drafts and posts, profiles, comments with replies, and post likes.

## Features

- Public, searchable, paginated feed with tag filtering.
- Email/password authentication with persisted Supabase sessions.
- Markdown post editor with previews, cover images, tags, and draft/publish workflow.
- Author-only post and profile management.
- Public comments, authenticated replies, and comment author/post author moderation.
- Database-enforced row-level security (RLS) for posts, profiles, comments, and likes.

## Local setup

### Prerequisites

- Node.js 18 or later
- A Supabase project

### 1. Configure Supabase

1. In the Supabase SQL editor, run `supabase/migrations/20260905061352_blog_platform_schema.sql`.
2. In **Authentication → URL Configuration**, add your local Vite URL (usually `http://localhost:5173`) as a redirect URL.
3. Copy `.env.example` to `.env` and set the project URL and anon key from **Project Settings → API**. Do not use the service-role key in the frontend.

### 2. Run the application

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create an account, then write a post; the database trigger will create a matching profile and generate a unique post slug.

## Verification commands

```bash
npm run typecheck
npm run lint
npm run build
```

## Deployment

Deploy the repository to Vercel or Netlify with the build command `npm run build` and publish directory `dist`. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the hosting provider. Add the production domain to Supabase Authentication URL Configuration before enabling signups.

## Security notes

All client access uses Supabase's anon key. Authorization is enforced by the RLS policies in the migration, not by UI visibility alone. The markdown renderer escapes HTML and only renders `http`, `https`, and `mailto` links; images allow only `http` and `https` URLs.
