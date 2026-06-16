import "./ThreadSummaryView.css";
import { NavLink, useNavigate } from "react-router-dom";
import type { ThreadSummary } from "@gamegalaxy/shared";
import useTimeSince from "@gamegalaxy/client/src/hooks/useTimeSince.ts";
import useThreadInfo from "@gamegalaxy/client/src/hooks/useThreadInfo.ts";
import ThreadReactionsPreview from "@gamegalaxy/client/src/components/ThreadReactionsPreview.tsx";

/**
 * Summarizes information for a single thread as part of a list of threads
 */
export default function ThreadSummaryView({
  threadId,
  createdBy,
  createdAt,
  title,
  comments,
}: ThreadSummary) {
  const navigate = useNavigate();
  const timeSince = useTimeSince();
  const { threadInfo, setThread } = useThreadInfo(threadId);

  return (
    <div className="threadSummary" role="listitem">
      <div className="postStats" onClick={() => navigate(`/forum/post/${threadId}`)}>
        {comments} {comments === 1 ? "reply" : "replies"}
      </div>
      <NavLink to={`/forum/post/${threadId}`} className="mid">
        {title}
      </NavLink>
      <div>
        {!("message" in threadInfo) && (
          <ThreadReactionsPreview thread={threadInfo} setThread={setThread} />
        )}
      </div>
      <div className="lastActivity">
        {createdBy.display} posted {timeSince(createdAt)}
      </div>
    </div>
  );
}
