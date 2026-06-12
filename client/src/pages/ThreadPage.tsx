import "./ThreadPage.css";
import "../components/NewForumComment.css";
import { useParams } from "react-router-dom";
import { type SubmitEvent, useState } from "react";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import ForumComment from "../components/ForumComment.tsx";
import ThreadReactions from "../components/ThreadReactions.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";
import useAuth from "../hooks/useAuth.ts";
import { editThread } from "../services/threadService.ts";

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const auth = useAuth();
  const { threadId } = useParams();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftText, setDraftText] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);

  const isOP = !("message" in threadInfo) && threadInfo.createdBy.username === auth.username;

  function startEditing(title: string, text: string) {
    setDraftTitle(title);
    setDraftText(text);
    setEditErr(null);
    setEditing(true);
  }

  async function handleEditSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (draftTitle.trim() === "" || draftText.trim() === "") {
      setEditErr("Please give the post a title and some content");
      return;
    }
    try {
      setThread(await editThread(auth, threadId!, { title: draftTitle, text: draftText }));
      setEditErr(null);
      setEditing(false);
    } catch (err) {
      setEditErr(`${err}`);
    }
  }

  return (
    <div className="content">
      {"message" in threadInfo ? (
        threadInfo.message
      ) : (
        <div className="spacedSection">
          {editing ? (
            <input
              className="notTooWide widefill"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          ) : (
            <h2>{threadInfo.title}</h2>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            Tags:
            {(threadInfo.tags ?? []).map((tag, index) => (
              <span
                key={index}
                style={{
                  padding: "4px 10px",
                  border: "1px solid blue",
                  borderRadius: "4px",
                  backgroundColor: "lightblue",
                  fontSize: "0.85rem",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          {editing ? (
            <form className="newForumComment" onSubmit={handleEditSubmit}>
              <textarea
                className="notTooWide"
                style={{ minHeight: "10rem" }}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
              />
              {editErr && <p className="error-message">{editErr}</p>}
              <div>
                <button className="primary narrow">Save</button>
                <button type="button" className="narrow" onClick={() => setEditing(false)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="notTooWide">{threadInfo.text}</div>
          )}
          <div className="smallAndGray">
            Posted by {threadInfo.createdBy.display} {formatTimeSince(threadInfo.createdAt)}
            {threadInfo.editedAt && ` (last edited ${formatTimeSince(threadInfo.editedAt)})`}
            {isOP && !editing && (
              <button
                type="button"
                className="narrow"
                onClick={() => startEditing(threadInfo.title, threadInfo.text)}
              >
                edit post
              </button>
            )}
          </div>
          <ThreadReactions thread={threadInfo} setThread={setThread} />
          <div className="dottedList">
            {(threadInfo.comments ?? []).map((comment) => (
              <ForumComment
                key={comment.commentId}
                comment={comment}
                thread={threadInfo}
                setThread={setThread}
              />
            ))}
          </div>
          <NewForumComment
            firstPost={threadInfo.comments.length === 0}
            threadId={threadInfo.threadId.toString()}
            setThread={setThread}
          />
        </div>
      )}
    </div>
  );
}
