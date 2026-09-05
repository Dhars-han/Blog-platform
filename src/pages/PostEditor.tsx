import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { createPost, updatePost, fetchPostById } from '@/lib/api';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Spinner } from '@/components/Loaders';
import { ArrowLeft, Save, Eye, X } from 'lucide-react';
import type { PostFormData } from '@/types';

interface PostEditorProps {
  postId?: string; // if provided, edit mode
}

export default function PostEditor({ postId }: PostEditorProps) {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<PostFormData>({
    title: '',
    content: '',
    excerpt: '',
    cover_image_url: '',
    tags: [],
    status: 'draft',
  });
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<'draft' | 'published'>('draft');

  const isEdit = !!postId;

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const post = await fetchPostById(postId);
      if (!post) {
        setError('Post not found');
        return;
      }
      if (post.author_id !== user?.id) {
        setError('You can only edit your own posts');
        return;
      }
      setForm({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        cover_image_url: post.cover_image_url,
        tags: post.tags || [],
        status: post.status,
      });
      setSaveMode(post.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [postId, user]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSave(status: 'draft' | 'published') {
    setError(null);

    if (!form.title.trim()) {
      setError('Please enter a title.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.content.trim()) {
      setError('Please write some content.');
      return;
    }

    setSaving(true);
    setSaveMode(status);
    try {
      const payload = { ...form, title: form.title.trim(), status };
      if (isEdit && postId) {
        const result = await updatePost(postId, payload);
        navigate(`/posts/${result.slug}`);
      } else {
        const result = await createPost(payload);
        navigate(`/posts/${result.slug}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !form.title) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={() => navigate('/my-posts')} className="btn-secondary mt-4">
          Back to My Posts
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(isEdit ? '/my-posts' : '/')}
          className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800 transition-colors"
        >
          <ArrowLeft size={16} /> {isEdit ? 'Back to My Posts' : 'Back to blog'}
        </button>
        <h1 className="font-serif text-xl font-bold text-ink-900">
          {isEdit ? 'Edit post' : 'Write a new post'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="An engaging title..."
            className="input text-lg font-semibold"
            maxLength={120}
          />
        </div>

        {/* Cover image URL */}
        <div>
          <label className="label" htmlFor="cover">Cover image URL <span className="text-ink-400 font-normal">(optional)</span></label>
          <input
            id="cover"
            type="url"
            value={form.cover_image_url}
            onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
            className="input"
          />
          {form.cover_image_url && (
            <div className="mt-2 overflow-hidden rounded-lg border border-ink-100">
              <img
                src={form.cover_image_url}
                alt="Cover preview"
                className="h-40 w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="label" htmlFor="tags">Tags <span className="text-ink-400 font-normal">(max 5)</span></label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-white p-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-xs font-medium text-sage-700"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="text-sage-500 hover:text-sage-900">
                  <X size={12} />
                </button>
              </span>
            ))}
            {form.tags.length < 5 && (
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                placeholder={form.tags.length === 0 ? "Add tags (press Enter)" : ""}
                className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
              />
            )}
          </div>
        </div>

        {/* Excerpt */}
        <div>
          <label className="label" htmlFor="excerpt">
            Excerpt <span className="text-ink-400 font-normal">(optional — auto-generated if left blank)</span>
          </label>
          <textarea
            id="excerpt"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            placeholder="A brief summary of your post..."
            rows={2}
            className="input resize-none"
            maxLength={300}
          />
        </div>

        {/* Content editor */}
        <div>
          <label className="label">Content</label>
          <MarkdownEditor
            value={form.content}
            onChange={(content) => setForm({ ...form, content })}
            placeholder="Write your post in markdown. Use the toolbar for formatting, or press Ctrl+B for bold, Ctrl+I for italic."
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3 border-t border-ink-100 pt-5 sm:flex-row sm:justify-end">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="btn-secondary"
          >
            {saving && saveMode === 'draft' ? <Spinner size="sm" /> : <Save size={16} />}
            Save as draft
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="btn-accent"
          >
            {saving && saveMode === 'published' ? <Spinner size="sm" /> : <Eye size={16} />}
            {isEdit && form.status === 'published' ? 'Update & publish' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
