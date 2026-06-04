import {
  type CreateThreadMessage,
  type ReactionEmoji,
  type ReactionInfo,
  type ThreadInfo,
  type ThreadSummary,
} from "@gamenite/shared";
import { populateSafeUserInfo } from "./user.service.ts";
import { createComment, populateCommentInfo } from "./comment.service.ts";
import { type UserWithId } from "../types.ts";
import { type ReactionEntry } from "../models.ts";
import { ThreadRepo } from "../repository.ts";

/**
 * Expand a stored reaction
 *
 * @param reaction - A reaction entry stored on a thread
 * @returns the expanded reaction info object
 */
async function populateReactionInfo({ createdBy, emoji }: ReactionEntry): Promise<ReactionInfo> {
  return { emoji, user: await populateSafeUserInfo(createdBy) };
}

/**
 * Expand a stored thread
 *
 * @param threadId - Valid thread id
 * @returns the expanded thread info object
 */
async function populateThreadInfo(threadId: string): Promise<ThreadInfo> {
  const thread = await ThreadRepo.get(threadId);
  return {
    threadId,
    title: thread.title,
    text: thread.text,
    createdBy: await populateSafeUserInfo(thread.createdBy),
    createdAt: new Date(thread.createdAt),
    comments: await Promise.all(thread.comments.map(populateCommentInfo)),
    reactions: await Promise.all((thread.reactions ?? []).map(populateReactionInfo)),
  };
}

/**
 * Expand just the summary information for a stored thread
 *
 * @param threadId - Valid thread id
 * @returns the expanded thread info object
 */
async function populateThreadSummary(threadId: string) {
  const thread = await ThreadRepo.get(threadId);
  return {
    threadId,
    title: thread.title,
    createdBy: await populateSafeUserInfo(thread.createdBy),
    createdAt: new Date(thread.createdAt),
    comments: thread.comments.length,
  };
}

/**
 * Create and store a new thread
 *
 * @param user - The thread poster
 * @param contents - Title and text of the thread
 * @param createdAt - Creation time for this thread
 * @returns the new thread's info object
 */
export async function createThread(
  user: UserWithId,
  { title, text }: CreateThreadMessage,
  createdAt: Date,
): Promise<ThreadInfo> {
  const id = await ThreadRepo.add({
    title,
    text,
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
    comments: [],
    reactions: [],
  });
  return populateThreadInfo(id);
}

/**
 * Retrieves a single thread from the database
 *
 * @param possibleThreadId - Ostensible thread ID
 * @returns the thread, or null if no thread with that ID exists
 */
export async function getThreadById(possibleThreadId: string): Promise<ThreadInfo | null> {
  const thread = await ThreadRepo.find(possibleThreadId);
  if (!thread) return null;
  return populateThreadInfo(possibleThreadId);
}

/**
 * Get a list of all threads
 *
 * @returns a list of thread summaries, ordered reverse chronologically by creation date
 */
export async function getThreadSummaries(): Promise<ThreadSummary[]> {
  const keys = await ThreadRepo.getAllKeys();
  const unsorted = await Promise.all(keys.map(populateThreadSummary));

  return unsorted.toSorted(
    (thread1, thread2) => thread2.createdAt.getTime() - thread1.createdAt.getTime(),
  );
}

/**
 * Add a comment id to a thread
 * @param possibleThreadId - Ostensible thread ID
 * @param user - Commenting user
 * @param text - Contents of the thread
 * @param createdAt - Creation time for thread
 * @returns the updated thread with comment attached, or null if the thread does not exist
 */
export async function addCommentToThread(
  possibleThreadId: string,
  user: UserWithId,
  text: string,
  createdAt: Date,
): Promise<ThreadInfo | null> {
  const oldThread = await ThreadRepo.find(possibleThreadId);
  if (!oldThread) return null;
  const threadId = possibleThreadId; // We know the thread ID is valid at this point
  const comment = await createComment(user, text, createdAt);
  const newThread = { ...oldThread, comments: [...oldThread.comments, comment.commentId] };
  await ThreadRepo.set(possibleThreadId, newThread);
  return populateThreadInfo(threadId);
}

/**
 * Toggle one of a user's reactions on a thread. A user may react with any
 * number of distinct emojis, but at most once per emoji. Reacting with the same
 * emoji again removes said emoji
 *
 * @param possibleThreadId - Ostensible thread ID
 * @param user - Reacting user
 * @param emoji - The emoji to toggle
 * @returns the updated thread, or null if the thread does not exist
 */
export async function setReactionOnThread(
  possibleThreadId: string,
  user: UserWithId,
  emoji: ReactionEmoji,
): Promise<ThreadInfo | null> {
  const oldThread = await ThreadRepo.find(possibleThreadId);
  if (!oldThread) return null;
  const threadId = possibleThreadId; // We know the thread ID is valid at this point
  const current = oldThread.reactions ?? [];
  const hasReacted = current.some((r) => r.createdBy === user.userId && r.emoji === emoji);

  const reactions: ReactionEntry[] = hasReacted
    ? current.filter((r) => !(r.createdBy === user.userId && r.emoji === emoji))
    : [...current, { createdBy: user.userId, emoji }];

  await ThreadRepo.set(threadId, { ...oldThread, reactions });
  return populateThreadInfo(threadId);
}
