import React, { useMemo, useState } from 'react';
import { MessageSquare, Pencil, Pin, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { commentTextFromHtml, commentTextToHtml, isBlankCommentHtml, } from '../../utils/commentText';
import { formatTimeAgo } from '../../utils/dateUtils';
import { formatTransitionDateTime } from '../../utils/statusTransitions';
import { canModerateComments } from '../../utils/roleUtils';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CommentContent } from '../common/RichTextEditor';
/**
 * Jira-style ACTIVITY → Comments thread: pinned comments first, then newest
 * first; author-only edit/delete (moderators may pin), a plain-text composer
 * at the bottom (Enter submits, Shift+Enter inserts a newline; disabled while
 * blank) and confirmation before deleting. Comments live on the work item in
 * the store and are persisted per-browser by utils/taskStatePersistence —
 * there is no backend, so other browsers/users do not see them.
 */
export const CommentsThread = ({ task }) => {
    const { users, addComment, editComment, deleteComment, toggleCommentPin } = useAppStore();
    const { currentUser } = useAuthStore();
    const [draft, setDraft] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editDraft, setEditDraft] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const actorRole = currentUser?.role;
    const canModerate = canModerateComments(actorRole);
    // Pinned comments above regular ones; inside each group newest first.
    const ordered = useMemo(() => [...task.comments].sort((a, b) => {
        const pinned = Number(!!b.pinned) - Number(!!a.pinned);
        if (pinned !== 0)
            return pinned;
        return b.createdAt.localeCompare(a.createdAt);
    }), [task.comments]);
    const canSubmit = !!currentUser && !isBlankCommentHtml(draft);
    const submit = () => {
        if (!currentUser || !canSubmit)
            return;
        const ok = addComment(task.id, currentUser.id, commentTextToHtml(draft), []);
        if (ok) {
            setDraft('');
            toast.success('Comment added');
        }
        else {
            toast.error('Could not add the comment. Please try again.');
        }
    };
    const submitEdit = (commentId) => {
        if (!currentUser)
            return;
        if (isBlankCommentHtml(editDraft)) {
            toast.error('A comment cannot be empty.');
            return;
        }
        const ok = editComment(task.id, commentId, commentTextToHtml(editDraft), currentUser.id);
        if (ok) {
            setEditingId(null);
            toast.success('Comment updated');
        }
        else {
            toast.error('You can only edit your own comments.');
        }
    };
    const confirmDelete = () => {
        if (!currentUser || !deleteTarget)
            return;
        const ok = deleteComment(task.id, deleteTarget.id, currentUser.id);
        setDeleteTarget(null);
        if (ok) {
            toast.success('Comment deleted');
        }
        else {
            toast.error('You can only delete your own comments.');
        }
    };
    const handlePin = (comment) => {
        if (!currentUser)
            return;
        const ok = toggleCommentPin(task.id, comment.id, currentUser.id);
        if (!ok)
            toast.error('You do not have permission to pin this comment.');
        else
            toast.success(comment.pinned ? 'Comment unpinned' : 'Comment pinned');
    };
    // Enter submits, Shift+Enter inserts a newline (never on IME composition).
    const composerKeyDown = (e, onEnter) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            onEnter();
        }
    };
    const actionButtonClass = 'p-1 rounded-md text-slate-400 hover:text-[#0d9488] hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40 transition-colors';
    return (<div className="space-y-3" data-testid="comments-thread">
      {ordered.length === 0 ? (<p className="fe-meta text-center py-4 flex items-center justify-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5"/> No comments yet. Be the first to comment.
        </p>) : (<div className="space-y-2">
          {ordered.map((comment) => {
                const author = users.find((u) => u.id === comment.userId);
                const isAuthor = !!currentUser && comment.userId === currentUser.id;
                const isEditing = editingId === comment.id;
                return (<div key={comment.id} className="group/cmt flex items-start gap-3 p-3 rounded-xl bg-[#f8fafc] border border-[#e2e5ea]" data-testid="comment-item">
                <Avatar name={author?.name || 'User'} color={author?.avatarColor} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="fe-control font-medium truncate">
                        {author?.name || 'Unknown user'}
                      </span>
                      {comment.pinned && (<span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded badge-amber text-[9px]">
                          <Pin className="w-2.5 h-2.5" aria-hidden="true"/> Pinned
                        </span>)}
                      <span className="fe-meta flex-shrink-0" title={formatTransitionDateTime(comment.createdAt)}>
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                      {comment.updatedAt && <span className="fe-meta">(edited)</span>}
                    </span>

                    {/* Unobtrusive actions: revealed on hover, always reachable
                        by keyboard via focus (buttons stay in the DOM). */}
                    <span className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/cmt:opacity-100 focus-within:opacity-100 transition-opacity">
                      {(isAuthor || canModerate) && (<button type="button" onClick={() => handlePin(comment)} className={actionButtonClass} aria-label={comment.pinned ? 'Unpin comment' : 'Pin comment'} title={comment.pinned ? 'Unpin comment' : 'Pin comment'}>
                          <Pin className="w-3.5 h-3.5"/>
                        </button>)}
                      {isAuthor && !isEditing && (<button type="button" onClick={() => {
                            setEditDraft(commentTextFromHtml(comment.content));
                            setEditingId(comment.id);
                        }} className={actionButtonClass} aria-label="Edit comment" title="Edit comment">
                          <Pencil className="w-3.5 h-3.5"/>
                        </button>)}
                      {isAuthor && (<button type="button" onClick={() => setDeleteTarget(comment)} className={`${actionButtonClass} hover:text-red-500 hover:bg-red-50`} aria-label="Delete comment" title="Delete comment">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>)}
                    </span>
                  </div>

                  {isEditing ? (<div className="space-y-2">
                      <textarea value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => composerKeyDown(e, () => submitEdit(comment.id))} placeholder="Edit your comment…" aria-label="Edit comment" rows={3} className="w-full rounded-xl border border-[#e2e5ea] bg-white px-3 py-2 fe-control resize-y focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15" autoFocus/>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="btn-secondary btn-xs">
                          Cancel
                        </button>
                        <button type="button" onClick={() => submitEdit(comment.id)} disabled={isBlankCommentHtml(editDraft)} className="btn-primary btn-xs">
                          Save
                        </button>
                      </div>
                    </div>) : (<CommentContent html={comment.content}/>)}
                </div>
              </div>);
            })}
        </div>)}

      {/* Composer — aligned with the list, same card width, at the bottom. */}
      <div className="pt-3 border-t border-[#eef0f3] space-y-2">
        <div className="flex items-start gap-3">
          <Avatar name={currentUser?.name || 'You'} color={currentUser?.avatarColor} size="sm"/>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => composerKeyDown(e, submit)} placeholder="Add a comment…" aria-label="Add a comment" rows={3} disabled={!currentUser} className="flex-1 min-w-0 min-h-[64px] rounded-xl border border-[#e2e5ea] bg-white px-3 py-2 fe-control resize-y focus:outline-none focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15 disabled:bg-slate-50"/>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="fe-meta">Shift+Enter for a new line</span>
          <button type="button" onClick={submit} disabled={!canSubmit} className="btn-primary btn-sm" data-testid="add-comment">
            <Send className="w-3.5 h-3.5"/> Add Comment
          </button>
        </div>
        {!currentUser && (<p className="fe-meta text-red-500">Sign in to add a comment.</p>)}
      </div>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} title="Delete comment?" message="This comment will be permanently removed from this work item. This cannot be undone." confirmLabel="Delete" danger/>
    </div>);
};
