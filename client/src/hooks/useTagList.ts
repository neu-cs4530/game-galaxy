import type { ErrorMsg } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { tagList } from "../services/tagService.ts";

/**
 * Custom hook to get the list of tags
 * @param maxTags - the maximum number of tags desired (default is all of them)
 * @returns A message to display to the user (Loading... or an error message), or a list
 */
export default function useTagList(maxTags?: number): { message: string } | string[] {
  const [tags, setTags] = useState<string[] | [string, number][] | ErrorMsg | null>(null);

  useEffect(() => {
    tagList()
      .then(setTags)
      .catch((err) => setTags({ error: `${err}` }));
  }, []);

  if (!tags) return { message: "Loading..." };
  if ("error" in tags) return { message: `Error: ${tags.error}` };
  if (tags.length === 0) return { message: "No threads found..." };
  if (maxTags) return tags.slice(0, maxTags).map((tag) => tag[0]);
  return tags.map((tag) => tag[0]);
}
