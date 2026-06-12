import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";

let response: Response;

describe("GET /api/auction/list", () => {
  it("should return the seeded open listing", async () => {
    response = await supertest(app).get("/api/auction/list");
    expect(response.status).toBe(200);
    expect(response.body.length).toBe(1);
    expect(response.body[0]).toMatchObject({
      auctionId: "auctionseed",
      startingPrice: 50,
      status: "open",
      offers: [],
      accessory: { accessoryId: "hat-01", name: "Hat", cost: 100 },
      seller: { username: "auctioneer" },
    });
  });
});
