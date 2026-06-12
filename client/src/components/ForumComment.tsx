import "./NewForumComment.css";
import { type SubmitEvent, useState } from "react";
import type { CommentInfo, ThreadInfo } from "@gamenite/shared";
import useAuth from "../hooks/useAuth.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import { editComment } from "../services/threadService.ts";

interface ForumCommentProps {
  comment: CommentInfo;
  thread: ThreadInfo;
  setThread: (newThread: ThreadInfo) => void;
}

/**
 * Renders a single forum comment
 */
export default function ForumComment({ comment, thread, setThread }: ForumCommentProps) {
  const auth = useAuth();
  const formatTimeSince = useTimeSince();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.text);
  const [err, setErr] = useState<string | null>(null);

  const isAuthor = comment.createdBy.username === auth.username;

  async function handleSave(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (draft.trim() === "") {
      setErr("Please put some text in the comment");
      return;
    }
    try {
      setThread(await editComment(auth, thread.threadId.toString(), comment.commentId, draft));
      setErr(null);
      setEditing(false);
    } catch (err) {
      setErr(`${err}`);
    }
  }

  function handleCancel() {
    setDraft(comment.text);
    setErr(null);
    setEditing(false);
  }

  return (
    <div className="dottedListItem" role="listitem">
      <div>
        {editing ? (
          <form className="newForumComment" onSubmit={handleSave}>
            <textarea
              className="notTooWide"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            {err && <p className="error-message">{err}</p>}
            <div>
              <button className="primary narrow">Save</button>
              <button type="button" className="narrow" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>{comment.text}</div>
        )}
        <div className="smallAndGray">
          Reply by {comment.createdBy.display}
          {comment.createdBy.username === thread.createdBy.username && (
            <span className="opBlue"> OP</span>
          )}{" "}
          {formatTimeSince(comment.createdAt)}
          {comment.editedAt && ` (last edited ${formatTimeSince(comment.editedAt)})`}
          {isAuthor && !editing && (
            <button type="button" className="narrow" onClick={() => setEditing(true)}>
              edit comment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
