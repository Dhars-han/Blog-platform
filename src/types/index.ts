export interface Profile {
  id: string;
  name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  tags: string[];
  status: 'draft' | 'published';
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  like_count?: number;
  comment_count?: number;
  liked_by_user?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: Profile;
  replies?: Comment[];
}

export interface PostWithRelations extends Post {
  author: Profile;
}

export type PostFormData = {
  title: string;
  content: string;
  excerpt: string;
  cover_image_url: string;
  tags: string[];
  status: 'draft' | 'published';
};
