import { api } from "@gamegalaxy/client/src/services/api.ts";
import type {
  CreateThreadMessage,
  EditThreadMessage,
  ErrorMsg,
  ReactionEmoji,
  ThreadInfo,
  ThreadSummary,
  UserAuth,
} from "@gamegalaxy/shared";

const THREAD_API_URL = `/api/thread`;

/**
 * Sends a GET request to get all threads
 */
export const threadList = async (): Promise<ThreadSummary[]> => {
  const res = await api.get<ThreadSummary[] | ErrorMsg>(`${THREAD_API_URL}/list`);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a GET request to get an individual thread
 */
export const threadInfo = async (id: string): Promise<ThreadInfo> => {
  const res = await api.get<ThreadInfo | ErrorMsg>(`${THREAD_API_URL}/${id}`);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a POST request to add a comment to a thread
 */
export const addCommentToThread = async (
  auth: UserAuth,
  id: string,
  payload: string,
): Promise<ThreadInfo> => {
  const res = await api.post<ThreadInfo | ErrorMsg>(`${THREAD_API_URL}/${id}/comment`, {
    auth,
    payload,
  });
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a POST request to edit an existing thread's title and text.
 */
export const editThread = async (
  auth: UserAuth,
  threadId: string,
  payload: EditThreadMessage,
): Promise<ThreadInfo> => {
  const res = await api.post<ThreadInfo | ErrorMsg>(`${THREAD_API_URL}/${threadId}`, {
    auth,
    payload,
  });
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a POST request to edit an existing comment on a thread.
 */
export const editComment = async (
  auth: UserAuth,
  threadId: string,
  commentId: string,
  payload: string,
): Promise<ThreadInfo> => {
  const res = await api.post<ThreadInfo | ErrorMsg>(
    `${THREAD_API_URL}/${threadId}/comment/${commentId}`,
    { auth, payload },
  );
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a POST request to toggle the current user's emoji reaction on a thread.
 * Sending the emoji the user already reacted with removes it; a different emoji
 * replaces it.
 */
export const reactToThread = async (
  auth: UserAuth,
  id: string,
  emoji: ReactionEmoji,
): Promise<ThreadInfo> => {
  const res = await api.post<ThreadInfo | ErrorMsg>(`${THREAD_API_URL}/${id}/react`, {
    auth,
    payload: { emoji },
  });
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a POST request to create a new thread
 */
export const createThread = async (
  auth: UserAuth,
  payload: CreateThreadMessage,
): Promise<ThreadInfo> => {
  const res = await api.post<ThreadInfo | ErrorMsg>(`${THREAD_API_URL}/create`, {
    auth,
    payload,
  });
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};
