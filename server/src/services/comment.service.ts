import { type CommentInfo } from "@gamegalaxy/shared";
import { populateSafeUserInfo } from "./user.service.ts";
import { type UserWithId } from "../types.ts";
import { CommentRepo } from "../repository.ts";

/**
 * Expand a stored comment
 *
 * @param commentId - Valid comment id
 * @returns the expanded comment info object
 */
export async function populateCommentInfo(commentId: string): Promise<CommentInfo> {
  const comment = await CommentRepo.get(commentId);
  return {
    commentId,
    text: comment.text,
    createdAt: new Date(comment.createdAt),
    createdBy: await populateSafeUserInfo(comment.createdBy),
    editedAt: comment.editedAt ? new Date(comment.editedAt) : undefined,
  };
}

/**
 * Creates and stores a new comment
 *
 * @param userId - a valid user id
 * @param text - the comment's text
 * @param createdAt - the time of comment creation
 * @returns the comment's info object
 */
export async function createComment(
  user: UserWithId,
  text: string,
  createdAt: Date,
): Promise<CommentInfo> {
  const id = await CommentRepo.add({
    text,
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
  });
  return populateCommentInfo(id);
}

/**
 * Edits an existing comment's text, recording the time of the edit. Only the
 * comment's original author may edit it.
 *
 * @param commentId - id of the comment to edit
 * @param user - the user attempting the edit
 * @param text - the new comment text
 * @param editedAt - the time of the edit
 * @returns the updated comment info, or null if the comment does not exist or
 * the user is not its author
 */
export async function editComment(
  commentId: string,
  user: UserWithId,
  text: string,
  editedAt: Date,
): Promise<CommentInfo | null> {
  const comment = await CommentRepo.find(commentId);
  if (!comment || comment.createdBy !== user.userId) return null;
  await CommentRepo.set(commentId, { ...comment, text, editedAt: editedAt.toISOString() });
  return populateCommentInfo(commentId);
}
