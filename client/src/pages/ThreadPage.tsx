import "./ThreadPage.css";
import { useParams } from "react-router-dom";
import useThreadInfo from "../hooks/useThreadInfo.ts";
import NewForumComment from "../components/NewForumComment.tsx";
import ThreadReactions from "../components/ThreadReactions.tsx";
import useTimeSince from "../hooks/useTimeSince.ts";

export default function ThreadPage() {
  const formatTimeSince = useTimeSince();
  const { threadId } = useParams();

  // non-nullish assertion is okay here given that Thread is only called in a
  // route with `:threadId` on the path
  const { threadInfo, setThread } = useThreadInfo(threadId!);

  return (
    <div className="content">
      {"message" in threadInfo ? (
        threadInfo.message
      ) : (
        <div className="spacedSection">
          <h2>{threadInfo.title}</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            Tags:
            {threadInfo.tags.map((tag, index) => (
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
          <div className="notTooWide">{threadInfo.text}</div>
          <div className="smallAndGray">
            Posted by {threadInfo.createdBy.display} {formatTimeSince(threadInfo.createdAt)}
          </div>
          <ThreadReactions thread={threadInfo} setThread={setThread} />
          <div className="dottedList">
            {threadInfo.comments.map(({ commentId, text, createdBy, createdAt, editedAt }) => (
              <div className="dottedListItem" role="listitem" key={commentId}>
                <div>
                  <div>{text}</div>
                  <div className="smallAndGray">
                    Reply by {createdBy.display}
                    {createdBy.username === threadInfo.createdBy.username && (
                      <span className="opBlue"> OP</span>
                    )}{" "}
                    {formatTimeSince(createdAt)}
                    {editedAt && ` (last edited ${formatTimeSince(editedAt)})`}
                  </div>
                </div>
              </div>
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
