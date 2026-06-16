import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";

let response: Response;

const auth1 = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const badAuth = { username: "user1", password: "nope" };

describe("POST /api/user/:username/shop/buy", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app)
      .post("/api/user/user1/shop/buy")
      .send({ auth: auth1, payload: 42 });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post("/api/user/user1/shop/buy")
      .send({ auth: badAuth, payload: "hat-01" });
    expect(response.status).toBe(403);
  });

  it("should return 403 when auth does not match the route username", async () => {
    response = await supertest(app)
      .post("/api/user/user1/shop/buy")
      .send({ auth: auth2, payload: "hat-01" });
    expect(response.status).toBe(403);
  });

  it("should return 400 when buying an item the user already owns", async () => {
    response = await supertest(app)
      .post("/api/user/user1/shop/buy")
      .send({ auth: auth1, payload: "face-01" });
    expect(response.status).toBe(400);
  });

  it("should return the updated user on a successful purchase", async () => {
    response = await supertest(app)
      .post("/api/user/user1/shop/buy")
      .send({ auth: auth1, payload: "hat-01" });
    expect(response.status).toBe(200);
    expect(response.body.avatar.accessories).toHaveProperty("hat-01");
  });
});

describe("POST /api/user/:username/closet/wear", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/wear")
      .send({ auth: auth1, payload: 42 });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/wear")
      .send({ auth: badAuth, payload: "face-01" });
    expect(response.status).toBe(403);
  });

  it("should return 403 when auth does not match the route username", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/wear")
      .send({ auth: auth2, payload: "face-01" });
    expect(response.status).toBe(403);
  });

  it("should return 400 when wearing an item the user does not own", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/wear")
      .send({ auth: auth1, payload: "hat-99" });
    expect(response.status).toBe(400);
  });

  it("should return the updated user when wearing an owned item", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/wear")
      .send({ auth: auth1, payload: "face-01" });
    expect(response.status).toBe(200);
    expect(response.body.avatar.accessories["face-01"]).toBe(true);
  });
});

describe("POST /api/user/:username/closet/remove", () => {
  it("should return 400 on ill-formed payload", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/remove")
      .send({ auth: auth1, payload: 42 });
    expect(response.status).toBe(400);
  });

  it("should return 403 with bad auth", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/remove")
      .send({ auth: badAuth, payload: "face-01" });
    expect(response.status).toBe(403);
  });

  it("should return 403 when auth does not match the route username", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/remove")
      .send({ auth: auth2, payload: "face-01" });
    expect(response.status).toBe(403);
  });

  it("should return 400 when removing an item the user does not own", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/remove")
      .send({ auth: auth1, payload: "hat-99" });
    expect(response.status).toBe(400);
  });

  it("should return the updated user when removing an owned item", async () => {
    response = await supertest(app)
      .post("/api/user/user1/closet/remove")
      .send({ auth: auth1, payload: "face-01" });
    expect(response.status).toBe(200);
    expect(response.body.avatar.accessories["face-01"]).toBe(false);
  });
});
