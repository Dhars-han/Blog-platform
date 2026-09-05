import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { fetchPosts, deletePost } from '@/lib/api';
import type { Post } from '@/types';
import { formatDate, classNames } from '@/lib/utils';
import { CardSkeleton, EmptyState, ErrorState, Spinner } from '@/components/Loaders';
import { FileText, Edit, Trash2, Plus, Eye, EyeOff } from 'lucide-react';

export default function MyPosts() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { posts: data } = await fetchPosts({
        authorId: user.id,
        status: filter === 'all' ? undefined : filter,
      });
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this post permanently?')) return;
    setDeletingId(id);
    try {
      await deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  const draftCount = posts.filter((p) => p.status === 'draft').length;
  const publishedCount = posts.filter((p) => p.status === 'published').length;

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink-900">My Posts</h1>
          <p className="mt-1 text-sm text-ink-500">
            {posts.length} total · {publishedCount} published · {draftCount} draft{draftCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => navigate('/posts/new')} className="btn-accent">
          <Plus size={16} /> New post
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-ink-100 p-1 w-fit">
        {(['all', 'published', 'draft'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={classNames(
              'rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors',
              filter === f
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadPosts} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title={filter === 'all' ? 'No posts yet' : `No ${filter} posts`}
          description={filter === 'all' ? 'Start writing your first post today.' : undefined}
          action={
            filter === 'all' && (
              <button onClick={() => navigate('/posts/new')} className="btn-accent">
                <Plus size={16} /> Write your first post
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              {post.cover_image_url ? (
                <img
                  src={post.cover_image_url}
                  alt=""
                  className="h-20 w-full rounded-lg object-cover sm:h-16 sm:w-24"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-20 w-full items-center justify-center rounded-lg bg-sage-100 sm:h-16 sm:w-24">
                  <FileText size={20} className="text-sage-400" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={classNames(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                      post.status === 'published'
                        ? 'bg-sage-100 text-sage-700'
                        : 'bg-amber-100 text-amber-700'
                    )}
                  >
                    {post.status === 'published' ? <Eye size={11} /> : <EyeOff size={11} />}
                    {post.status}
                  </span>
                  <span className="text-xs text-ink-400">{formatDate(post.created_at)}</span>
                </div>
                <h2
                  className="mt-1.5 cursor-pointer font-serif text-lg font-bold text-ink-900 hover:text-accent-700"
                  onClick={() => navigate(`/posts/${post.slug}`)}
                >
                  {post.title}
                </h2>
                <p className="mt-0.5 line-clamp-1 text-sm text-ink-500">
                  {post.excerpt || 'No excerpt'}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:flex-col">
                <button
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  className="btn-secondary text-xs"
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deletingId === post.id}
                  className="btn-ghost text-xs text-red-600 hover:bg-red-50"
                >
                  {deletingId === post.id ? <Spinner size="sm" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
