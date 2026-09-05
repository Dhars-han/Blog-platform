import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/context/RouterContext';
import { useAuth } from '@/context/AuthContext';
import { fetchProfile, updateProfile, fetchPosts } from '@/lib/api';
import type { Profile, Post } from '@/types';
import { formatDate } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import { Spinner, EmptyState, ErrorState } from '@/components/Loaders';
import { Save, X, Edit3, FileText } from 'lucide-react';

interface UserProfileProps {
  userId: string;
}

export default function UserProfile({ userId }: UserProfileProps) {
  const { navigate } = useRouter();
  const { user: currentUser, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfile(userId);
      if (!data) {
        setError('Profile not found');
        return;
      }
      setProfile(data);
      setEditForm({ name: data.name, bio: data.bio, avatar_url: data.avatar_url });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPosts = useCallback(async () => {
    try {
      const { posts: data } = await fetchPosts({ authorId: userId, status: 'published' });
      setPosts(data);
    } catch {
      // non-fatal
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [loadProfile, loadPosts]);

  async function handleSaveProfile() {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateProfile(currentUser.id, editForm);
      await refreshProfile();
      await loadProfile();
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
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

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState message={error} onRetry={loadProfile} />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="animate-fade-in">
      {/* Profile header */}
      <div className="bg-gradient-to-b from-sage-50 to-ink-50 py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar
              name={profile.name || 'User'}
              url={profile.avatar_url}
              size="xl"
            />
            <div className="flex-1 text-center sm:text-left">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="Your name"
                      className="input"
                    />
                  </div>
                  <div>
                    <input
                      type="url"
                      value={editForm.avatar_url}
                      onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                      placeholder="Avatar image URL (optional)"
                      className="input"
                    />
                  </div>
                  <div>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      placeholder="Tell readers about yourself..."
                      rows={3}
                      className="input resize-none"
                      maxLength={300}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveProfile} disabled={saving} className="btn-primary">
                      {saving ? <Spinner size="sm" /> : <Save size={15} />} Save changes
                    </button>
                    <button onClick={() => setEditing(false)} className="btn-ghost">
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="font-serif text-2xl font-bold text-ink-900">
                    {profile.name || 'Anonymous'}
                  </h1>
                  <p className="mt-0.5 text-sm text-ink-500">
                    Joined {formatDate(profile.created_at)}
                  </p>
                  {profile.bio && (
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-ink-600">
                      {profile.bio}
                    </p>
                  )}
                  {isOwnProfile && !editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="btn-secondary mt-4"
                    >
                      <Edit3 size={15} /> Edit profile
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts by this user */}
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h2 className="mb-5 font-serif text-xl font-bold text-ink-900">
          {isOwnProfile ? 'Your published posts' : 'Posts'} ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No published posts yet"
            description={
              isOwnProfile ? 'Publish a post to see it here.' : 'This author hasn\'t published any posts.'
            }
            action={
              isOwnProfile && (
                <button onClick={() => navigate('/posts/new')} className="btn-accent">
                  Write a post
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/posts/${post.slug}`)}
                className="card group cursor-pointer p-4 transition-all hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  {post.cover_image_url ? (
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap gap-1.5">
                      {post.tags?.slice(0, 2).map((tag) => (
                        <span key={tag} className="tag-chip">{tag}</span>
                      ))}
                    </div>
                    <h3 className="font-serif text-base font-bold text-ink-900 group-hover:text-accent-700 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-500">
                      {post.excerpt || 'No excerpt'}
                    </p>
                    <p className="mt-1.5 text-xs text-ink-400">{formatDate(post.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
