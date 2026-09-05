import { supabase } from '@/lib/supabase';
import type { Post, Comment, Profile, PostFormData } from '@/types';

const POSTS_PER_PAGE = 9;

export async function fetchPosts(opts: {
  page?: number;
  search?: string;
  tag?: string;
  authorId?: string;
  status?: 'draft' | 'published';
}): Promise<{ posts: Post[]; total: number }> {
  const page = opts.page ?? 1;
  const from = (page - 1) * POSTS_PER_PAGE;
  const to = from + POSTS_PER_PAGE - 1;

  let query = supabase
    .from('posts')
    .select(
      'id, title, slug, excerpt, cover_image_url, tags, status, author_id, created_at, updated_at, author:profiles!posts_author_id_fkey(id, name, avatar_url, bio)',
      { count: 'exact' }
    );

  if (opts.status) {
    query = query.eq('status', opts.status);
  } else if (!opts.authorId) {
    query = query.eq('status', 'published');
  }

  if (opts.authorId) {
    query = query.eq('author_id', opts.authorId);
  }

  if (opts.search) {
    query = query.or(`title.ilike.%${opts.search}%,content.ilike.%${opts.search}%`);
  }

  if (opts.tag) {
    query = query.contains('tags', [opts.tag]);
  }

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(error.message);

  return {
    posts: (data || []) as unknown as Post[],
    total: count ?? 0,
  };
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, title, slug, content, excerpt, cover_image_url, tags, status, author_id, created_at, updated_at, author:profiles!posts_author_id_fkey(id, name, avatar_url, bio, created_at)'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as Post | null;
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, title, slug, content, excerpt, cover_image_url, tags, status, author_id, created_at, updated_at, author:profiles!posts_author_id_fkey(id, name, avatar_url, bio, created_at)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as unknown as Post | null;
}

export async function createPost(form: PostFormData): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      cover_image_url: form.cover_image_url,
      tags: form.tags,
      status: form.status,
    })
    .select('id, slug')
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Post;
}

export async function updatePost(id: string, form: PostFormData): Promise<Post> {
  const { data, error } = await supabase
    .from('posts')
    .update({
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      cover_image_url: form.cover_image_url,
      tags: form.tags,
      status: form.status,
    })
    .eq('id', id)
    .select('id, slug')
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchAllTags(): Promise<string[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('tags')
    .eq('status', 'published');

  if (error) throw new Error(error.message);

  const tagSet = new Set<string>();
  (data || []).forEach((row) => {
    (row.tags as string[] || []).forEach((t) => tagSet.add(t));
  });
  return Array.from(tagSet).sort();
}

// ============================================================
// COMMENTS
// ============================================================

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      'id, content, post_id, author_id, parent_id, created_at, updated_at, author:profiles!comments_author_id_fkey(id, name, avatar_url)'
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as unknown as Comment[];
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string | null
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      content,
      parent_id: parentId ?? null,
    })
    .select(
      'id, content, post_id, author_id, parent_id, created_at, updated_at, author:profiles!comments_author_id_fkey(id, name, avatar_url)'
    )
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as Comment;
}

export async function updateComment(id: string, content: string): Promise<void> {
  const { error } = await supabase.from('comments').update({ content }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ============================================================
// LIKES
// ============================================================

export async function fetchLikeInfo(postId: string, userId?: string) {
  const { count, error: countError } = await supabase
    .from('post_likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (countError) throw new Error(countError.message);

  let likedByUser = false;
  if (userId) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    likedByUser = !!data;
  }

  return { likeCount: count ?? 0, likedByUser };
}

export async function toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return { liked: false };
  } else {
    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: userId });
    if (error) throw new Error(error.message);
    return { liked: true };
  }
}

// ============================================================
// PROFILES
// ============================================================

export async function fetchProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Profile | null;
}

export async function updateProfile(
  id: string,
  updates: { name?: string; bio?: string; avatar_url?: string }
): Promise<void> {
  const { error } = await supabase.from('profiles').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}
