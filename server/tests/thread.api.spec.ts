import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";
import { randomUUID } from "node:crypto";

let response: Response;

const baseAvatar = {
  color: "blue",
  avatar: {
    color: "blue",
    accessories: { "face-01": true },
  },
};
const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };

describe("GET /api/thread/list", () => {
  it("should return all threads", async () => {
    response = await supertest(app).get("/api/thread/list");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(5);
  });

  it("should return the most recent thread first", async () => {
    response = await supertest(app).get("/api/thread/list");
    expect(response.status).toBe(200);
    expect(response.body[0]).toStrictEqual({
      threadId: "abadcafeabadcafeabadcafe",
      comments: 0,
      createdAt: expect.anything(),
      title: "Nim?",
      createdBy: {
        createdAt: expect.anything(),
        display: "Yāo",
        balance: expect.anything(),
        username: "user1",
        avatar: baseAvatar,
      },
      tags: ["nim", "matchmaking"],
    });
  });
});

describe("GET /api/thread/:id", () => {
  it("should return 404 on a bad id", async () => {
    response = await supertest(app).get(`/api/thread/${randomUUID().toString()}`);
    expect(response.status).toBe(404);
  });

  it("should return existing ids", async () => {
    response = await supertest(app).get(`/api/thread/deadbeefdeadbeefdeadbeef`);
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      threadId: "deadbeefdeadbeefdeadbeef",
      title: "Hello game knights",
      text: "I'm a big Nim buff and am excited to join this community.",
      comments: [],
      createdBy: {
        username: "user1",
        display: "Yāo",
        createdAt: expect.anything(),
        avatar: baseAvatar,
        balance: expect.anything(),
      },
      reactions: [
        {
          emoji: "👍",
          user: {
            avatar: {
              accessories: { "face-01": true },
              color: "blue",
            },
            balance: expect.anything(),
            createdAt: expect.anything(),
            display: "The Knight Of Games",
            username: "user0",
          },
        },
      ],
      createdAt: new Date("2025-04-02").toISOString(),
      tags: ["nim"],
    });
  });
});

describe("POST /api/thread/create", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app).post(`/api/thread/create`).send({ auth1 });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post(`/api/thread/create`)
      .send({
        auth: { ...auth1, password: "no" },
        payload: { title: "Evil title", text: "Evil contents", tags: [] },
      });
    expect(response.status).toBe(403);
  });

  it("should succeed with correct information", async () => {
    response = await supertest(app)
      .post(`/api/thread/create`)
      .send({ auth: auth2, payload: { title: "Title", text: "Text", tags: [] } });
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({
      threadId: expect.anything(),
      title: "Title",
      text: "Text",
      tags: [],
      createdAt: expect.anything(),
      createdBy: {
        username: "user2",
        display: expect.any(String),
        balance: expect.anything(),
        createdAt: expect.anything(),
        avatar: baseAvatar,
      },
      comments: [],
      reactions: [],
    });
  });
});

describe("POST /api/thread/:id/comment", () => {
  const comment = { auth: auth2, payload: "FIRST!" };

  it("should return 400 on on ill-formed payload", async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/comment`)
      .send({ auth: auth1, payload: 4 });
    expect(response.status).toBe(400);
  });

  it("should return 404 on a bad id", async () => {
    response = await supertest(app)
      .post(`/api/thread/${randomUUID().toString()}/comment`)
      .send(comment);
    expect(response.status).toBe(404);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/comment`)
      .send({ ...comment, auth: { ...auth1, username: "user1", password: "no" } });
    expect(response.status).toBe(403);
  });

  it("should succeed with correct information", async () => {
    response = await supertest(app)
      .post(`/api/thread/deadbeefdeadbeefdeadbeef/comment`)
      .send(comment);
    expect(response.status).toBe(200);
    expect(response.body?.comments).toStrictEqual([
      {
        commentId: expect.anything(),
        createdAt: expect.anything(),
        text: "FIRST!",
        createdBy: {
          username: "user2",
          display: "Sénior Dos",
          createdAt: expect.anything(),
          balance: expect.anything(),
          avatar: baseAvatar,
        },
      },
    ]);
  });
});

describe("POST /api/thread/:id/react", () => {
  // The "Hello game knights" thread is seeded with a single 👍 from user0.
  const threadId = "deadbeefdeadbeefdeadbeef";

  it("should return 400 on an ill-formed payload", async () => {
    response = await supertest(app)
      .post(`/api/thread/${threadId}/react`)
      .send({ auth: auth1, payload: { emoji: "not-an-emoji" } });
    expect(response.status).toBe(400);
  });

  it("should return 404 on a bad id", async () => {
    response = await supertest(app)
      .post(`/api/thread/${randomUUID().toString()}/react`)
      .send({ auth: auth1, payload: { emoji: "👍" } });
    expect(response.status).toBe(404);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post(`/api/thread/${threadId}/react`)
      .send({ auth: { ...auth1, password: "no" }, payload: { emoji: "👍" } });
    expect(response.status).toBe(403);
  });

  it("should add a new reaction for a user who hasn't reacted", async () => {
    response = await supertest(app)
      .post(`/api/thread/${threadId}/react`)
      .send({ auth: auth1, payload: { emoji: "😂" } });
    expect(response.status).toBe(200);
    expect(response.body.reactions).toContainEqual({
      emoji: "😂",
      user: {
        avatar: expect.anything(),
        balance: 100,
        username: "user1",
        display: "Yāo",
        createdAt: expect.anything(),
      },
    });
    expect(response.body.reactions).toContainEqual({
      emoji: "👍",
      user: {
        avatar: expect.anything(),
        balance: 100,
        username: "user0",
        display: expect.any(String),
        createdAt: expect.anything(),
      },
    });
  });

  it("should remove the reaction when the same emoji is sent again", async () => {
    response = await supertest(app)
      .post(`/api/thread/${threadId}/react`)
      .send({ auth: { username: "user0", password: "pwd0000" }, payload: { emoji: "👍" } });
    expect(response.status).toBe(200);
    expect(response.body.reactions).toStrictEqual([]);
  });

  it("should add a second reaction when a different emoji is sent", async () => {
    response = await supertest(app)
      .post(`/api/thread/${threadId}/react`)
      .send({ auth: { username: "user0", password: "pwd0000" }, payload: { emoji: "❤️" } });
    expect(response.status).toBe(200);
    expect(response.body.reactions).toContainEqual({
      emoji: "👍",
      user: {
        avatar: expect.anything(),
        balance: 100,
        username: "user0",
        display: "The Knight Of Games",
        createdAt: expect.anything(),
      },
    });
    expect(response.body.reactions).toContainEqual({
      emoji: "❤️",
      user: {
        avatar: expect.anything(),
        balance: 100,
        username: "user0",
        display: "The Knight Of Games",
        createdAt: expect.anything(),
      },
    });
  });
});
