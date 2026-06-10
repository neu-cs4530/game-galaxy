import { useNavigate } from "react-router-dom";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import useThreadList from "../hooks/useThreadList.ts";
import { useState } from "react";
import useTagList from "../hooks/useTagList.ts";

export default function ThreadList() {
  const threadList = useThreadList();
  const navigate = useNavigate();
  const [newestFirst, setNewestFirst] = useState(true);
  const [filter, setFilter] = useState<string[]>([]);
  const topTags = useTagList(5);

  const sortedList =
    "message" in threadList
      ? threadList
      : [...threadList]
          .sort((a, b) =>
            newestFirst
              ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
          .filter(
            (thread) =>
              filter.length === 0 || filter.every((tag) => (thread.tags ?? []).includes(tag)),
          );

  const handleTagButton = (tag: string) => {
    if (filter.includes(tag)) {
      setFilter((prev) => prev.filter((value) => value !== tag));
    } else {
      setFilter((prev) => [...prev, tag]);
    }
  };

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
        <div
          className="tightSection"
          style={{ display: "flex", flexDirection: "row", gap: "5px", alignItems: "center" }}
        >
          <div className="smallAndGray">Common Tags</div>
          {"message" in topTags ? (
            <div>{topTags.message}</div>
          ) : (
            topTags.map((tag, idx) => (
              <button
                type="button"
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  handleTagButton(tag);
                }}
                style={{
                  padding: "2px 8px",
                  fontSize: "0.85rem",
                  width: "fit-content",
                  background: filter.includes(tag) ? "lightblue" : "lightgray",
                }}
              >
                {tag}
              </button>
            ))
          )}
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
