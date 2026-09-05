import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { createComment, updateComment, deleteComment } from '@/lib/api';
import type { Comment } from '@/types';
import { formatRelative } from '@/lib/utils';
import Avatar from '@/components/Avatar';
import { Spinner, EmptyState } from '@/components/Loaders';
import { MessageCircle, Edit2, Trash2, Reply, Send } from 'lucide-react';

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  loading: boolean;
  currentUserId?: string;
  postAuthorId: string;
  onReload: () => void;
}

export function CommentSection({
  postId,
  comments,
  loading,
  currentUserId,
  postAuthorId,
  onReload,
}: CommentSectionProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Build threaded structure
  const topLevel = comments.filter((c) => !c.parent_id);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      (acc[c.parent_id] ||= []).push(c);
    }
    return acc;
  }, {});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createComment(postId, newComment.trim());
      setNewComment('');
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!replyText.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createComment(postId, replyText.trim(), parentId);
      setReplyText('');
      setReplyTo(null);
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditSave(commentId: string) {
    if (!editText.trim()) return;
    setSubmitting(true);
    try {
      await updateComment(commentId, editText.trim());
      setEditingId(null);
      setEditText('');
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
      onReload();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }

  return (
    <div>
      <h3 className="mb-6 font-serif text-xl font-bold text-ink-900">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar name="" url={undefined} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="input resize-none"
              />
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
              <div className="mt-2 flex justify-end">
                <button type="submit" disabled={submitting || !newComment.trim()} className="btn-primary">
                  {submitting ? <Spinner size="sm" /> : (<><Send size={15} /> Post comment</>)}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-xl border border-ink-100 bg-ink-50 p-4 text-center">
          <p className="text-sm text-ink-600">
            <button onClick={() => navigate('/login')} className="font-medium text-accent-600 hover:text-accent-700">
              Sign in
            </button>{' '}
            to join the conversation.
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : comments.length === 0 ? (
        <EmptyState
          icon={<MessageCircle size={24} />}
          title="No comments yet"
          description="Start the conversation by leaving a comment."
        />
      ) : (
        <div className="space-y-5">
          {topLevel.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUserId}
                postAuthorId={postAuthorId}
                editingId={editingId}
                editText={editText}
                replyTo={replyTo}
                replyText={replyText}
                submitting={submitting}
                onEditStart={() => { setEditingId(comment.id); setEditText(comment.content); }}
                onEditCancel={() => { setEditingId(null); setEditText(''); }}
                onEditSave={() => handleEditSave(comment.id)}
                onEditTextChange={setEditText}
                onReplyStart={() => { setReplyTo(comment.id); setReplyText(''); }}
                onReplyCancel={() => { setReplyTo(null); setReplyText(''); }}
                onReplySubmit={() => handleReply(comment.id)}
                onReplyTextChange={setReplyText}
                onDelete={() => handleDelete(comment.id)}
              />
              {repliesByParent[comment.id] && (
                <div className="mt-3 ml-6 space-y-3 border-l-2 border-ink-100 pl-4 sm:ml-12 sm:pl-6">
                  {repliesByParent[comment.id].map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      postAuthorId={postAuthorId}
                      editingId={editingId}
                      editText={editText}
                      replyTo={replyTo}
                      replyText={replyText}
                      submitting={submitting}
                      onEditStart={() => { setEditingId(reply.id); setEditText(reply.content); }}
                      onEditCancel={() => { setEditingId(null); setEditText(''); }}
                      onEditSave={() => handleEditSave(reply.id)}
                      onEditTextChange={setEditText}
                      onReplyStart={() => { setReplyTo(reply.id); setReplyText(''); }}
                      onReplyCancel={() => { setReplyTo(null); setReplyText(''); }}
                      onReplySubmit={() => handleReply(reply.id)}
                      onReplyTextChange={setReplyText}
                      onDelete={() => handleDelete(reply.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  postAuthorId: string;
  editingId: string | null;
  editText: string;
  replyTo: string | null;
  replyText: string;
  submitting: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditSave: () => void;
  onEditTextChange: (v: string) => void;
  onReplyStart: () => void;
  onReplyCancel: () => void;
  onReplySubmit: () => void;
  onReplyTextChange: (v: string) => void;
  onDelete: () => void;
}

function CommentItem({
  comment,
  currentUserId,
  postAuthorId,
  editingId,
  editText,
  replyTo,
  replyText,
  submitting,
  onEditStart,
  onEditCancel,
  onEditSave,
  onEditTextChange,
  onReplyStart,
  onReplyCancel,
  onReplySubmit,
  onReplyTextChange,
  onDelete,
}: CommentItemProps) {
  const isAuthor = currentUserId === comment.author_id;
  const isPostAuthor = currentUserId === postAuthorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isPostAuthor;
  const isEditing = editingId === comment.id;
  const isReplying = replyTo === comment.id;

  return (
    <div className="animate-slide-up">
      <div className="flex gap-3">
        <Avatar
          name={comment.author?.name || 'Unknown'}
          url={comment.author?.avatar_url}
          size="sm"
        />
        <div className="flex-1">
          <div className="rounded-lg bg-ink-50 px-4 py-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-800">
                {comment.author?.name || 'Unknown'}
              </span>
              <span className="text-xs text-ink-400">{formatRelative(comment.created_at)}</span>
              {comment.updated_at !== comment.created_at && (
                <span className="text-xs text-ink-400">(edited)</span>
              )}
            </div>
            {isEditing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => onEditTextChange(e.target.value)}
                  rows={2}
                  className="input resize-none text-sm"
                  autoFocus
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={onEditSave}
                    disabled={submitting}
                    className="btn-primary text-xs"
                  >
                    Save
                  </button>
                  <button onClick={onEditCancel} className="btn-ghost text-xs">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-ink-700">{comment.content}</p>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="mt-1.5 flex items-center gap-3 pl-1">
              <button
                onClick={onReplyStart}
                className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 transition-colors"
              >
                <Reply size={13} /> Reply
              </button>
              {canEdit && !isEditing && (
                <button
                  onClick={onEditStart}
                  className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800 transition-colors"
                >
                  <Edit2 size={13} /> Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          )}

          {/* Reply form */}
          {isReplying && (
            <div className="mt-2">
              <textarea
                value={replyText}
                onChange={(e) => onReplyTextChange(e.target.value)}
                placeholder={`Reply to ${comment.author?.name || 'comment'}...`}
                rows={2}
                className="input resize-none text-sm"
                autoFocus
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={onReplySubmit}
                  disabled={submitting || !replyText.trim()}
                  className="btn-primary text-xs"
                >
                  Post reply
                </button>
                <button onClick={onReplyCancel} className="btn-ghost text-xs">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
