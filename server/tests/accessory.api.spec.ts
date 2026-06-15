import { describe, expect, it } from "vitest";
import supertest, { type Response } from "supertest";
import { app } from "../src/app.ts";

let response: Response;

describe("GET /api/accessory", () => {
  it("should return the full accessory catalog", async () => {
    response = await supertest(app).get("/api/accessory");
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        { accessoryId: "hat-01", name: "Hat", cost: 100 },
        { accessoryId: "bow-01", name: "Bow", cost: 75 },
        { accessoryId: "tie-01", name: "Tie", cost: 75 },
        { accessoryId: "face-01", name: "Default Face", cost: 0 },
      ]),
    );
  });
});
