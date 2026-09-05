import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { fetchPostBySlug, fetchComments, fetchLikeInfo, toggleLike, deletePost } from '@/lib/api';
import { renderMarkdown } from '@/components/MarkdownEditor';
import type { Post, Comment } from '@/types';
import { formatDate, readingTime, classNames } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import { FullPageLoader, ErrorState, EmptyState } from '@/components/Loaders';
import { CommentSection } from '@/components/CommentSection';
import { ArrowLeft, Heart, MessageCircle, Edit, Trash2 } from 'lucide-react';

interface PostDetailProps {
  slug: string;
}

export default function PostDetail({ slug }: PostDetailProps) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPostBySlug(slug);
      if (!data) {
        setError('Post not found');
        return;
      }
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadComments = useCallback(async () => {
    if (!post) return;
    setCommentsLoading(true);
    try {
      const data = await fetchComments(post.id);
      setComments(data);
    } catch {
      // non-fatal
    } finally {
      setCommentsLoading(false);
    }
  }, [post]);

  const loadLikeInfo = useCallback(async () => {
    if (!post) return;
    try {
      const info = await fetchLikeInfo(post.id, user?.id);
      setLikeCount(info.likeCount);
      setLiked(info.likedByUser);
    } catch {
      // non-fatal
    }
  }, [post, user]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    if (post) {
      loadComments();
      loadLikeInfo();
    }
  }, [post, loadComments, loadLikeInfo]);

  async function handleLikeToggle() {
    if (!user || !post) {
      navigate('/login');
      return;
    }
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    try {
      await toggleLike(post.id, user.id, wasLiked);
    } catch {
      setLiked(wasLiked);
      setLikeCount((c) => c + (wasLiked ? 1 : -1));
    } finally {
      setLikeLoading(false);
    }
  }

  async function handleDelete() {
    if (!post || !user) return;
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return;
    try {
      await deletePost(post.id);
      navigate('/my-posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
    }
  }

  if (loading) return <FullPageLoader label="Loading post..." />;
  if (error) return <ErrorState message={error} onRetry={loadPost} />;
  if (!post) return <EmptyState title="Post not found" />;

  const isAuthor = user?.id === post.author_id;
  const isDraft = post.status === 'draft';

  return (
    <div className="animate-fade-in">
      {/* Back link */}
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to blog
        </button>
      </div>

      {/* Draft banner */}
      {isDraft && (
        <div className="mx-auto mt-4 max-w-3xl px-4 sm:px-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            This is a draft. Only you can see it.
          </div>
        </div>
      )}

      {/* Cover image */}
      {post.cover_image_url && (
        <div className="mx-auto mt-6 max-w-4xl px-4 sm:px-6">
          <div className="aspect-[16/7] overflow-hidden rounded-xl bg-ink-100">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article header */}
      <div className="mx-auto mt-8 max-w-3xl px-4 sm:px-6">
        {post.tags && post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="tag-chip">{tag}</span>
            ))}
          </div>
        )}
        <h1 className="font-serif text-3xl font-bold leading-tight text-ink-900 sm:text-4xl">
          {post.title}
        </h1>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={post.author?.name || 'Unknown'}
              url={post.author?.avatar_url}
              size="md"
            />
            <div>
              <button
                onClick={() => post.author && navigate(`/profile/${post.author.id}`)}
                className="text-sm font-semibold text-ink-800 hover:text-accent-700"
              >
                {post.author?.name || 'Unknown'}
              </button>
              <p className="text-xs text-ink-500">
                {formatDate(post.created_at)} · {readingTime(post.content)}
              </p>
            </div>
          </div>

          {isAuthor && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/posts/${post.id}/edit`)}
                className="btn-secondary"
              >
                <Edit size={15} /> Edit
              </button>
              <button onClick={handleDelete} className="btn-ghost text-red-600 hover:bg-red-50">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Article content */}
      <article
        className="prose-blog mx-auto mt-8 max-w-3xl px-4 sm:px-6"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />

      {/* Engagement bar */}
      <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
        <div className="flex items-center gap-4 border-t border-b border-ink-100 py-4">
          <button
            onClick={handleLikeToggle}
            disabled={likeLoading}
            className={classNames(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
              liked
                ? 'bg-red-50 text-red-600'
                : 'text-ink-600 hover:bg-ink-100'
            )}
          >
            <Heart size={18} className={liked ? 'fill-current' : ''} />
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </button>
          <span className="flex items-center gap-2 text-sm text-ink-500">
            <MessageCircle size={18} />
            {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div className="mx-auto mt-8 max-w-3xl px-4 pb-16 sm:px-6">
        <CommentSection
          postId={post.id}
          comments={comments}
          loading={commentsLoading}
          currentUserId={user?.id}
          postAuthorId={post.author_id}
          onReload={loadComments}
        />
      </div>
    </div>
  );
}
