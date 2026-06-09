import useNewThreadForm from "../hooks/useNewThreadForm.ts";
import { useState } from "react";
import useTagList from "../hooks/useTagList.ts";

export default function NewThread() {
  const {
    title,
    contents,
    err,
    tags,
    handleInputChange,
    handleSubmit,
    handleTagsKeyDown,
    handleTagButton,
  } = useNewThreadForm();
  const [tagInput, setTagInput] = useState<string>("");
  const topTags = useTagList(5);

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Create new post</h2>
      <div className="tightSection">
        <div className="smallAndGray">Title</div>
        <input
          className="notTooWide widefill"
          value={title}
          onChange={(e) => handleInputChange(e, "title")}
        />
      </div>
      <div className="tightSection">
        <div className="smallAndGray">Tags</div>
        <input
          className="notTooWide"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => handleTagsKeyDown(e, setTagInput)}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {tags.map((tag, index) => (
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
      <div className="tightSection">
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
              }}
            >
              {tag}
            </button>
          ))
        )}
      </div>
      <div className="tightSection">
        <div className="smallAndGray">Post contents</div>
        <textarea
          className="notTooWide"
          style={{ minHeight: "10rem" }}
          value={contents}
          onChange={(e) => handleInputChange(e, "contents")}
        ></textarea>
      </div>
      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Create</button>
      </div>
    </form>
  );
}
