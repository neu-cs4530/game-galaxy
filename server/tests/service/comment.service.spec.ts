import { describe, expect, it } from "vitest";
import { createComment, populateCommentInfo } from "../../src/services/comment.service.ts";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import { CommentRepo } from "../../src/repository.ts";

async function idOf(username: string): Promise<string> {
  return (await getUserByUsername(username))!.userId;
}

describe("comment.service", () => {
  it("createComment stores a comment with no edit time", async () => {
    const user = (await getUserByUsername("user1"))!;
    const comment = await createComment(user, "hello world", new Date());
    expect(comment).toMatchObject({
      commentId: expect.any(String),
      text: "hello world",
      createdBy: expect.objectContaining({ username: "user1" }),
    });
    expect(comment.editedAt).toBeUndefined();
  });

  it("populateCommentInfo surfaces the edit time when one is stored", async () => {
    const editedAt = new Date("2025-05-01").toISOString();
    const commentId = await CommentRepo.add({
      text: "an edited comment",
      createdAt: new Date("2025-04-30").toISOString(),
      createdBy: await idOf("user2"),
      editedAt,
    });

    const comment = await populateCommentInfo(commentId);
    expect(comment.editedAt).toEqual(new Date(editedAt));
  });
});
