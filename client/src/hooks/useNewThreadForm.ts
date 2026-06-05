import { type ChangeEvent, type KeyboardEvent, useState, type SubmitEvent } from "react";
import useAuth from "./useAuth.ts";
import { useNavigate } from "react-router-dom";
import { createThread } from "../services/threadService.ts";

/**
 * Custom hook to manage thread creation form logic
 * @throws if outside a LoginContext
 * @returns an object containing
 *  - Form values `title` and `contents`
 *  - Possibly-null error message `err`
 *  - Form handlers `handleInputChange`, `handleTagsKeyDown`, and `handleSubmit`
 */
export default function useNewThreadForm() {
  const [title, setTitle] = useState("");
  const [contents, setContents] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const auth = useAuth();
  const navigate = useNavigate();

  /**
   * Handles form input change
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: "title" | "contents",
  ) => {
    if (field === "title") {
      setTitle(e.target.value);
    } else if (field === "contents") {
      setContents(e.target.value);
    }
  };

  const handleTagButton = (tag: string) => {
    setTags((prev) => [...prev, tag]);
  };

  /**
   * Handles form enter press for adding tags to post
   */
  const handleTagsKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    setTagInput: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value) {
        setTags((prev) => [...prev, value]);
        setTagInput(""); // clear input after adding
      }
    }
  };

  /**
   * Handles submission of the form
   */
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (title.trim() === "") {
      setErr("A title is required");
      return;
    }

    if (contents.trim() === "") {
      setErr("The post is required to have contents");
      return;
    }

    try {
      const thread = await createThread(auth, { title, text: contents, tags });
      await navigate(`/forum/post/${thread.threadId}`);
    } catch (err) {
      setErr(`${err}`);
    }
  };

  return {
    title,
    contents,
    err,
    tags,
    handleInputChange,
    handleSubmit,
    handleTagsKeyDown,
    handleTagButton,
  };
}
