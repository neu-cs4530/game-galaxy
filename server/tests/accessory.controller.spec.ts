import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameServer, GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";
import {
  socketBuyAccessory,
  socketWearAccessory,
  socketRemoveAccessory,
} from "../src/controllers/accessory.controller.ts";
import { UserRepo } from "../src/repository.ts";
import { getUserByUsername } from "../src/services/auth.service.ts";

// Mock the logSocketError function so we can test error conditions in sockets
vi.mock(import("../src/controllers/socket.controller.ts"), () => {
  return { logSocketError: vi.fn() };
});

/**
 * The mock game server only implements a tiny slice of GameServer,
 * and trying to call other methods will result in an error.
 */
const MockGameServer = vi.fn(
  class {
    to = vi.fn(() => this); // allows chaining
    emit = vi.fn();
  },
);

/**
 * The mock socket server only implements a tiny slice of GameServerSocket,
 * and trying to call other methods will result in an error
 */
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
const badAuth = { username: "user1", password: "nope" };

async function ownedBy(username: string, accessoryId: string): Promise<boolean> {
  const record = await getUserByUsername(username);
  const user = await UserRepo.get(record!.userId);
  return accessoryId in user.avatar.accessories;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("socketBuyAccessory", () => {
  it("should reject invalid auth", async () => {
    await socketBuyAccessory(mockSocket, mockServer)({ auth: badAuth, payload: "bow-01" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should reject a malformed payload", async () => {
    await socketBuyAccessory(mockSocket, mockServer)({ auth, payload: 7 });
    expect(logSocketError).toHaveBeenCalledOnce();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("should buy the accessory and emit the updated balance", async () => {
    await socketBuyAccessory(mockSocket, mockServer)({ auth, payload: "bow-01" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledExactlyOnceWith("balanceUpdated", { balance: 25 });
    expect(await ownedBy("user1", "bow-01")).toBe(true);
  });

  it("should log an error when the user already owns the accessory", async () => {
    await socketBuyAccessory(mockSocket, mockServer)({ auth, payload: "face-01" });
    expect(logSocketError).toHaveBeenCalledOnce();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });
});

describe("socketWearAccessory", () => {
  it("should reject invalid auth", async () => {
    await socketWearAccessory(mockSocket, mockServer)({ auth: badAuth, payload: "face-01" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should wear an owned accessory without error", async () => {
    await socketWearAccessory(mockSocket, mockServer)({ auth, payload: "face-01" });
    expect(logSocketError).not.toHaveBeenCalled();
    const record = await getUserByUsername("user1");
    const user = await UserRepo.get(record!.userId);
    expect(user.avatar.accessories["face-01"]).toBe(true);
  });

  it("should log an error when the user does not own the accessory", async () => {
    await socketWearAccessory(mockSocket, mockServer)({ auth, payload: "hat-01" });
    expect(logSocketError).toHaveBeenCalledOnce();
  });
});

describe("socketRemoveAccessory", () => {
  it("should reject invalid auth", async () => {
    await socketRemoveAccessory(mockSocket, mockServer)({ auth: badAuth, payload: "face-01" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should remove an owned accessory without error", async () => {
    await socketRemoveAccessory(mockSocket, mockServer)({ auth, payload: "face-01" });
    expect(logSocketError).not.toHaveBeenCalled();
    const record = await getUserByUsername("user1");
    const user = await UserRepo.get(record!.userId);
    expect(user.avatar.accessories["face-01"]).toBe(false);
  });

  it("should log an error when the user does not own the accessory", async () => {
    await socketRemoveAccessory(mockSocket, mockServer)({ auth, payload: "hat-01" });
    expect(logSocketError).toHaveBeenCalledOnce();
  });
});
