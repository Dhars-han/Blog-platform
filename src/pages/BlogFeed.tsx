import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { fetchPosts, fetchAllTags } from '@/lib/api';
import type { Post } from '@/types';
import { formatDate, readingTime, classNames } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import { CardSkeleton, EmptyState, ErrorState } from '@/components/Loaders';
import { Search, FileText, PenSquare } from 'lucide-react';

const POSTS_PER_PAGE = 9;

export default function BlogFeed() {
  const { navigate } = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { posts: data, total: count } = await fetchPosts({
        page,
        search: debouncedSearch || undefined,
        tag: activeTag ?? undefined,
      });
      setPosts(data);
      setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, activeTag]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    fetchAllTags()
      .then(setTags)
      .catch(() => {})
      .finally(() => setTagsLoading(false));
  }, []);

  // Debounce search input so a query is not sent for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setPage((currentPage) => (currentPage === 1 ? currentPage : 1));
  }, [activeTag]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  const handleTagToggle = (tag: string) => {
    setActiveTag(activeTag === tag ? null : tag);
  };

  const hasFilters = search || activeTag;

  return (
    <div className="animate-fade-in">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-sage-50 to-ink-50 pb-12 pt-10 sm:pt-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            Ideas worth reading
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-600 sm:text-lg">
            Stories, insights, and perspectives from our community of writers.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Search & filter bar */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts by title or content..."
              className="input pl-10"
            />
          </div>

          {!tagsLoading && tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-500">
                Topics:
              </span>
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={classNames(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    activeTag === tag
                      ? 'bg-ink-900 text-white'
                      : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                  )}
                >
                  {tag}
                </button>
              ))}
              {activeTag && (
                <button
                  onClick={() => setActiveTag(null)}
                  className="text-xs font-medium text-accent-600 hover:text-accent-700"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Posts grid */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadPosts} />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<FileText size={28} />}
            title={hasFilters ? 'No posts found' : 'No posts yet'}
            description={
              hasFilters
                ? 'Try adjusting your search or filters.'
                : 'Be the first to share a story.'
            }
            action={
              !hasFilters && (
                <button onClick={() => navigate('/posts/new')} className="btn-accent">
                  <PenSquare size={16} /> Write a post
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onClick={() => navigate(`/posts/${post.slug}`)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={classNames(
                          'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                          p === page
                            ? 'bg-ink-900 text-white'
                            : 'text-ink-600 hover:bg-ink-100'
                        )}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === page - 2 || p === page + 2) {
                    return <span key={p} className="text-ink-400">…</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="card group cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    >
      {post.cover_image_url ? (
        <div className="h-48 overflow-hidden bg-ink-100">
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center bg-gradient-to-br from-sage-100 to-sage-200">
          <span className="font-serif text-4xl font-bold text-sage-300">
            {post.title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <div className="p-5">
        {post.tags && post.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="tag-chip">
                {tag}
              </span>
            ))}
          </div>
        )}
        <h2 className="mb-2 font-serif text-lg font-bold leading-snug text-ink-900 group-hover:text-accent-700 transition-colors">
          {post.title}
        </h2>
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-ink-600">
          {post.excerpt || 'No excerpt available'}
        </p>
        <div className="flex items-center justify-between border-t border-ink-100 pt-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={post.author?.name || 'Unknown'}
              url={post.author?.avatar_url}
              size="sm"
            />
            <div>
              <p className="text-xs font-medium text-ink-700">
                {post.author?.name || 'Unknown'}
              </p>
              <p className="text-xs text-ink-400">{formatDate(post.created_at)}</p>
            </div>
          </div>
          <span className="text-xs text-ink-400">{readingTime(post.content)}</span>
        </div>
      </div>
    </article>
  );
}
