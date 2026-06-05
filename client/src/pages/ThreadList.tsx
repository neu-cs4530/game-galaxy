import { useNavigate } from "react-router-dom";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import useThreadList from "../hooks/useThreadList.ts";
import { useState } from "react";

export default function ThreadList() {
  const threadList = useThreadList();
  const navigate = useNavigate();
  const [newestFirst, setNewestFirst] = useState(true);

  const sortedList =
    "message" in threadList
      ? threadList
      : [...threadList].sort((a, b) =>
          newestFirst
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );

  return (
    <div className="content">
      <div className="spacedSection">
        <h2>All forum posts</h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="primary narrow" onClick={() => navigate("/forum/post/new")}>
            Create New Post
          </button>
          <button className="secondary narrow" onClick={() => setNewestFirst((prev) => !prev)}>
            {newestFirst ? "Oldest First" : "Newest First"}
          </button>
        </div>
        <>
          {"message" in sortedList ? (
            sortedList.message
          ) : (
            <div className="dottedList">
              {sortedList.map((thread) => (
                <ThreadSummaryView {...thread} key={thread.threadId.toString()} />
              ))}
            </div>
          )}
        </>
      </div>
    </div>
  );
}
