import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameServer, GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";
import {
  socketCreateAuction,
  socketMakeOffer,
  socketAcceptOffer,
} from "../src/controllers/auction.controller.ts";
import { getOpenAuctions, makeOffer } from "../src/services/auction.service.ts";
import { getUserByUsername } from "../src/services/auth.service.ts";

// Mock the logSocketError function so we can test error conditions in sockets
vi.mock(import("../src/controllers/socket.controller.ts"), () => {
  return { logSocketError: vi.fn() };
});

const MockGameServer = vi.fn(
  class {
    to = vi.fn(() => this); // allows chaining
    emit = vi.fn();
  },
);

const MockGameServerSocket = vi.fn(
  class {
    id = "mockGameServerSocket";
    join = vi.fn();
    leave = vi.fn();
    emit = vi.fn();
    to = vi.fn(() => this); // allows chaining
  },
);

const mockServer = new MockGameServer() as unknown as GameServer;
const mockSocket = new MockGameServerSocket() as unknown as GameServerSocket;
const auth = { username: "user1", password: "pwd1111" };
const auctioneerAuth = { username: "auctioneer", password: "ilovetoauction" };
const badAuth = { username: "user1", password: "nope" };
const SEEDED_AUCTION = "auctionseed";

async function idOf(username: string): Promise<string> {
  return (await getUserByUsername(username))!.userId;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("socketCreateAuction", () => {
  it("should reject invalid auth", async () => {
    await socketCreateAuction(
      mockSocket,
      mockServer,
    )({
      auth: badAuth,
      payload: { accessoryId: "face-01", startingPrice: 10 },
    });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
    expect(mockServer.emit).not.toHaveBeenCalled();
  });

  it("should create the auction and broadcast the update", async () => {
    await socketCreateAuction(
      mockSocket,
      mockServer,
    )({
      auth,
      payload: { accessoryId: "face-01", startingPrice: 10 },
    });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.emit).toHaveBeenCalledExactlyOnceWith("auctionsUpdated");
  });

  it("should log an error when auctioning an unowned item", async () => {
    await socketCreateAuction(
      mockSocket,
      mockServer,
    )({
      auth,
      payload: { accessoryId: "hat-01", startingPrice: 10 },
    });
    expect(logSocketError).toHaveBeenCalledOnce();
    expect(mockServer.emit).not.toHaveBeenCalled();
  });
});

describe("socketMakeOffer", () => {
  it("should reject invalid auth", async () => {
    await socketMakeOffer(
      mockSocket,
      mockServer,
    )({
      auth: badAuth,
      payload: { auctionId: SEEDED_AUCTION, price: 30 },
    });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should record the offer and notify everyone", async () => {
    await socketMakeOffer(
      mockSocket,
      mockServer,
    )({
      auth,
      payload: { auctionId: SEEDED_AUCTION, price: 30, message: "please!" },
    });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.emit).toHaveBeenCalledWith("auctionsUpdated");
    expect(mockServer.emit).toHaveBeenCalledWith("auctionOfferReceived", {
      seller: "auctioneer",
      auctionId: SEEDED_AUCTION,
      accessoryName: "Hat",
      bidderDisplay: "MrMango",
      price: 30,
    });
  });

  it("should log an error when the seller bids on their own listing", async () => {
    await socketMakeOffer(
      mockSocket,
      mockServer,
    )({
      auth: auctioneerAuth,
      payload: { auctionId: SEEDED_AUCTION, price: 30 },
    });
    expect(logSocketError).toHaveBeenCalledOnce();
    expect(mockServer.emit).not.toHaveBeenCalled();
  });
});

describe("socketAcceptOffer", () => {
  it("should reject invalid auth", async () => {
    await socketAcceptOffer(
      mockSocket,
      mockServer,
    )({
      auth: badAuth,
      payload: { auctionId: SEEDED_AUCTION, offerId: "whatever" },
    });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should accept the offer, update balances, and notify everyone", async () => {
    const user1 = await idOf("user1");
    await makeOffer(user1, SEEDED_AUCTION, 30, "please!");
    const listing = (await getOpenAuctions()).find((l) => l.auctionId === SEEDED_AUCTION)!;
    const offerId = listing.offers[0].offerId;

    await socketAcceptOffer(
      mockSocket,
      mockServer,
    )({
      auth: auctioneerAuth,
      payload: { auctionId: SEEDED_AUCTION, offerId },
    });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledExactlyOnceWith("balanceUpdated", { balance: 30 });
    expect(mockServer.emit).toHaveBeenCalledWith("auctionsUpdated");
    expect(mockServer.emit).toHaveBeenCalledWith("auctionOfferAccepted", {
      winner: "user1",
      auctionId: SEEDED_AUCTION,
      accessoryName: "Hat",
      newBalance: 70,
      losingBidders: [],
    });
  });

  it("should log an error when accepting a nonexistent offer", async () => {
    await socketAcceptOffer(
      mockSocket,
      mockServer,
    )({
      auth: auctioneerAuth,
      payload: { auctionId: SEEDED_AUCTION, offerId: "does-not-exist" },
    });
    expect(logSocketError).toHaveBeenCalledOnce();
    expect(mockServer.emit).not.toHaveBeenCalled();
  });
});
