import { describe, expect, it } from "vitest";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import {
  createThread,
  addCommentToThread,
  editThread,
  editCommentInThread,
} from "../../src/services/thread.service.ts";

async function record(username: string) {
  return (await getUserByUsername(username))!;
}

describe("thread.service — editThread", () => {
  it("should return null for a nonexistent thread id", async () => {
    const user1 = await record("user1");
    const result = await editThread("no-such-id", user1, { title: "t", text: "x" }, new Date());
    expect(result).toBeNull();
  });

  it("should return null when the editor is not the thread author", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const thread = await createThread(
      user1,
      { title: "Original", text: "Text", tags: [] },
      new Date(),
    );
    const result = await editThread(
      thread.threadId,
      user2,
      { title: "Hijacked", text: "Evil" },
      new Date(),
    );
    expect(result).toBeNull();
  });

  it("should update title, text, and editedAt when called by the author", async () => {
    const user1 = await record("user1");
    const thread = await createThread(
      user1,
      { title: "Original", text: "Text", tags: [] },
      new Date(),
    );
    const result = await editThread(
      thread.threadId,
      user1,
      { title: "New title", text: "New text" },
      new Date(),
    );
    expect(result).not.toBeNull();
    expect(result!.title).toBe("New title");
    expect(result!.text).toBe("New text");
    expect(result!.editedAt).toBeDefined();
  });
});

describe("thread.service — editCommentInThread", () => {
  it("should return null for a nonexistent thread id", async () => {
    const user1 = await record("user1");
    const result = await editCommentInThread(
      "no-such-thread",
      "no-such-comment",
      user1,
      "text",
      new Date(),
    );
    expect(result).toBeNull();
  });

  it("should return null when the comment id is not on the thread", async () => {
    const user1 = await record("user1");
    const thread = await createThread(user1, { title: "t", text: "x", tags: [] }, new Date());
    const result = await editCommentInThread(
      thread.threadId,
      "no-such-comment",
      user1,
      "text",
      new Date(),
    );
    expect(result).toBeNull();
  });

  it("should return null when the editor is not the comment author", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const thread = await createThread(user1, { title: "t", text: "x", tags: [] }, new Date());
    const withComment = await addCommentToThread(thread.threadId, user1, "original", new Date());
    const commentId = withComment!.comments[0].commentId;
    const result = await editCommentInThread(
      thread.threadId,
      commentId,
      user2,
      "hijacked",
      new Date(),
    );
    expect(result).toBeNull();
  });

  it("should update the comment text when called by the author", async () => {
    const user1 = await record("user1");
    const thread = await createThread(user1, { title: "t", text: "x", tags: [] }, new Date());
    const withComment = await addCommentToThread(thread.threadId, user1, "original", new Date());
    const commentId = withComment!.comments[0].commentId;
    const result = await editCommentInThread(
      thread.threadId,
      commentId,
      user1,
      "updated",
      new Date(),
    );
    expect(result).not.toBeNull();
    expect(result!.comments[0].text).toBe("updated");
  });
});
