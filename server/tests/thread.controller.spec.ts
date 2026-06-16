import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";
import { randomUUID } from "node:crypto";

let response: Response;

const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const THREAD_ID = "deadbeefdeadbeefdeadbeef";

describe("POST /api/thread/:id (edit thread)", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app).post(`/api/thread/${THREAD_ID}`).send({ auth: auth1 });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}`)
      .send({
        auth: { ...auth1, password: "no" },
        payload: { title: "New title", text: "New text" },
      });
    expect(response.status).toBe(403);
  });

  it("should return 404 when the thread does not exist", async () => {
    response = await supertest(app)
      .post(`/api/thread/${randomUUID()}`)
      .send({ auth: auth1, payload: { title: "New title", text: "New text" } });
    expect(response.status).toBe(404);
  });

  it("should return 404 when the user is not the thread author", async () => {
    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}`)
      .send({ auth: auth2, payload: { title: "New title", text: "New text" } });
    expect(response.status).toBe(404);
  });

  it("should update the thread when called by the author", async () => {
    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}`)
      .send({ auth: auth1, payload: { title: "Updated title", text: "Updated text" } });
    expect(response.status).toBe(200);
    expect(response.body.title).toBe("Updated title");
    expect(response.body.text).toBe("Updated text");
    expect(response.body.editedAt).toBeDefined();
  });
});

describe("POST /api/thread/:id/comment/:commentId (edit comment)", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment/some-comment-id`)
      .send({ auth: auth1, payload: 42 });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment/some-comment-id`)
      .send({ auth: { ...auth1, password: "no" }, payload: "edited text" });
    expect(response.status).toBe(403);
  });

  it("should return 404 when the thread does not exist", async () => {
    response = await supertest(app)
      .post(`/api/thread/${randomUUID()}/comment/some-comment-id`)
      .send({ auth: auth1, payload: "edited text" });
    expect(response.status).toBe(404);
  });

  it("should return 404 when the comment does not exist on the thread", async () => {
    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment/${randomUUID()}`)
      .send({ auth: auth1, payload: "edited text" });
    expect(response.status).toBe(404);
  });

  it("should update the comment when called by the comment author", async () => {
    // first add a comment as user2, then edit it
    const addResponse = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment`)
      .send({ auth: auth2, payload: "original text" });
    const comments1 = addResponse.body.comments as Array<{ commentId: string; text: string }>;
    const commentId = comments1.at(-1)!.commentId;

    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment/${commentId}`)
      .send({ auth: auth2, payload: "edited text" });
    expect(response.status).toBe(200);
    const comments2 = response.body.comments as Array<{ commentId: string; text: string }>;
    expect(comments2.find((c) => c.commentId === commentId)?.text).toBe("edited text");
  });

  it("should return 404 when a non-author tries to edit the comment", async () => {
    const addResponse = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment`)
      .send({ auth: auth2, payload: "original text" });
    const comments = addResponse.body.comments as Array<{ commentId: string; text: string }>;
    const commentId = comments.at(-1)!.commentId;

    response = await supertest(app)
      .post(`/api/thread/${THREAD_ID}/comment/${commentId}`)
      .send({ auth: auth1, payload: "stolen edit" });
    expect(response.status).toBe(404);
  });
});
