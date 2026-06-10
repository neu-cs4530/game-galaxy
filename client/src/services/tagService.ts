import { api } from "./api.ts";
import type { ErrorMsg } from "@gamenite/shared";

const TAG_API_URL = `/api/tag`;

/**
 * Sends a GET request to get all tags
 */
export const tagList = async (): Promise<[string, number][]> => {
  const res = await api.get<[string, number][] | ErrorMsg>(`${TAG_API_URL}/list`);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};
