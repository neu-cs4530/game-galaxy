import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameServer, GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";
import { socketJoin, socketLeave, handleDisconnect } from "../src/controllers/lobby.controller.ts";

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
const badAuth = { username: "user1", password: "nope" };

afterEach(() => {
  // Drop any lingering lobby presence between tests, since it is module state.
  handleDisconnect(mockServer, mockSocket);
  vi.resetAllMocks();
});

describe("socketJoin", () => {
  it("should reject invalid auth", async () => {
    await socketJoin(mockSocket, mockServer)({ auth: badAuth, payload: "anything" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should join the lobby room and broadcast players and tables", async () => {
    await socketJoin(mockSocket, mockServer)({ auth, payload: "anything" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.join).toHaveBeenCalledExactlyOnceWith("lobby:presence");
    expect(mockServer.to).toHaveBeenCalledWith("lobby:presence");
    expect(mockServer.emit).toHaveBeenCalledWith(
      "lobbyPlayersUpdated",
      expect.arrayContaining([expect.objectContaining({ username: "user1" })]),
    );
    expect(mockServer.emit).toHaveBeenCalledWith("lobbyTablesUpdated", expect.any(Array));
  });
});

describe("socketLeave", () => {
  it("should leave the lobby room and broadcast the updated players", async () => {
    await socketJoin(mockSocket, mockServer)({ auth, payload: "anything" });
    vi.resetAllMocks();

    await socketLeave(mockSocket, mockServer)({ auth, payload: "anything" });
    expect(mockSocket.leave).toHaveBeenCalledExactlyOnceWith("lobby:presence");
    expect(mockServer.emit).toHaveBeenCalledWith("lobbyPlayersUpdated", []);
  });

  it("should not broadcast when the socket was not present", async () => {
    await socketLeave(mockSocket, mockServer)({ auth, payload: "anything" });
    expect(mockSocket.leave).toHaveBeenCalledExactlyOnceWith("lobby:presence");
    expect(mockServer.emit).not.toHaveBeenCalled();
  });
});

describe("handleDisconnect", () => {
  it("should broadcast the updated players when a present socket disconnects", async () => {
    await socketJoin(mockSocket, mockServer)({ auth, payload: "anything" });
    vi.resetAllMocks();

    handleDisconnect(mockServer, mockSocket);
    expect(mockServer.emit).toHaveBeenCalledWith("lobbyPlayersUpdated", []);
  });

  it("should do nothing when an unknown socket disconnects", () => {
    handleDisconnect(mockServer, mockSocket);
    expect(mockServer.emit).not.toHaveBeenCalled();
  });
});
