import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameServer, GameServerSocket } from "../src/types.ts";
import { logSocketError } from "../src/controllers/socket.controller.ts";
import {
  socketWatch,
  socketStart,
  socketMakeMove,
  socketJoinAsPlayer,
} from "../src/controllers/game.controller.ts";
import { createGame, joinGame, startGame, getGames } from "../src/services/game.service.ts";
import { setTableGame } from "../src/services/table.service.ts";
import { getUserByUsername } from "../src/services/auth.service.ts";
import { GameRepo, UserRepo } from "../src/repository.ts";

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
    rooms = new Set<string>();
    join = vi.fn();
    leave = vi.fn();
    emit = vi.fn();
    to = vi.fn(() => this); // allows chaining
  },
);

const mockServer = new MockGameServer() as unknown as GameServer;
const mockSocket = new MockGameServerSocket() as unknown as GameServerSocket;
const auth = { username: "user1", password: "pwd1111" };
const auth2 = { username: "user2", password: "pwd2222" };
const auth3 = { username: "user3", password: "pwd3333" };
const auctioneerAuth = { username: "auctioneer", password: "ilovetoauction" };
const badAuth = { username: "user1", password: "nope" };

async function record(username: string) {
  return (await getUserByUsername(username))!;
}

afterEach(() => {
  vi.resetAllMocks();
  mockSocket.rooms.clear();
});

describe("socketWatch", () => {
  it("should reject invalid auth", async () => {
    await socketWatch(mockSocket, mockServer)({ auth: badAuth, payload: "anything" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should log an error for an invalid game id", async () => {
    await socketWatch(mockSocket, mockServer)({ auth, payload: "no-such-game" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(
      mockSocket,
      new Error("user user1 viewed an invalid game id"),
    );
  });

  it("should join the player rooms and emit the watched game for a player", async () => {
    const user = await record("user1");
    const game = await createGame(user, "nim", new Date());
    await socketWatch(mockSocket, mockServer)({ auth, payload: game.gameId });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.join).toHaveBeenCalledExactlyOnceWith([
      game.gameId,
      `${game.gameId}-${user.userId}`,
    ]);
    expect(mockSocket.emit).toHaveBeenCalledExactlyOnceWith("gameWatched", {
      gameId: game.gameId,
      view: null,
      players: expect.arrayContaining([expect.objectContaining({ username: "user1" })]),
    });
  });

  it("should join only the game room for a non-player watcher", async () => {
    const creator = await record("user1");
    const game = await createGame(creator, "nim", new Date());
    await socketWatch(mockSocket, mockServer)({ auth: auth2, payload: game.gameId });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.join).toHaveBeenCalledExactlyOnceWith([game.gameId]);
  });
});

describe("socketStart", () => {
  it("should reject invalid auth", async () => {
    await socketStart(mockSocket, mockServer)({ auth: badAuth, payload: "anything" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should log an error for an invalid game id", async () => {
    await socketStart(mockSocket, mockServer)({ auth, payload: "no-such-game" });
    expect(logSocketError).toHaveBeenCalledOnce();
  });

  it("should start a fully-populated game and broadcast view updates", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);

    await socketStart(mockSocket, mockServer)({ auth, payload: game.gameId });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.to).toHaveBeenCalledWith(game.gameId);
    expect(mockServer.emit).toHaveBeenCalledWith(
      "gameStateUpdated",
      expect.objectContaining({ forPlayer: false }),
    );
    expect(mockServer.to).toHaveBeenCalledWith(`${game.gameId}-${user1.userId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      "gameStateUpdated",
      expect.objectContaining({ forPlayer: true }),
    );
  });

  it("should free a reserved table when starting its game", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);

    // Associate the game with a table so starting it releases the reservation.
    const stored = await GameRepo.get(game.gameId);
    stored.table = "table:nim";
    await GameRepo.set(game.gameId, stored);

    await socketStart(mockSocket, mockServer)({ auth, payload: game.gameId });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.emit).toHaveBeenCalledWith("gameStateUpdated", expect.anything());
  });
});

describe("socketMakeMove", () => {
  it("should reject invalid auth", async () => {
    await socketMakeMove(
      mockSocket,
      mockServer,
    )({
      auth: badAuth,
      payload: { gameId: "anything", move: 1 },
    });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should log an error for a move in a game that has not started", async () => {
    const user1 = await record("user1");
    const game = await createGame(user1, "nim", new Date());
    await socketMakeMove(
      mockSocket,
      mockServer,
    )({
      auth,
      payload: { gameId: game.gameId, move: 1 },
    });
    expect(logSocketError).toHaveBeenCalledOnce();
  });

  it("should apply a valid move and broadcast view updates without rewarding", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);

    await socketMakeMove(
      mockSocket,
      mockServer,
    )({
      auth,
      payload: { gameId: game.gameId, move: 3 },
    });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.emit).toHaveBeenCalledWith("gameStateUpdated", expect.anything());
    expect(mockServer.emit).not.toHaveBeenCalledWith("balanceUpdated", expect.anything());
  });

  it("should reward the winner when a move ends the game", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);

    // Set the game one winning move away: player 0 (user1) takes the last 3.
    const stored = await GameRepo.get(game.gameId);
    stored.state = { remaining: 3, nextPlayer: 0 };
    await GameRepo.set(game.gameId, stored);

    await socketMakeMove(
      mockSocket,
      mockServer,
    )({
      auth,
      payload: { gameId: game.gameId, move: 3 },
    });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockServer.to).toHaveBeenCalledWith(`${game.gameId}-${user2.userId}`);
    expect(mockServer.emit).toHaveBeenCalledWith("balanceUpdated", { balance: 110 });

    const winner = await UserRepo.get(user2.userId);
    expect(winner.balance).toBe(110);
    expect(winner.wins).toBe(1);
  });
});

describe("socketJoinAsPlayer", () => {
  it("should reject invalid auth", async () => {
    await socketJoinAsPlayer(mockSocket, mockServer)({ auth: badAuth, payload: "table:nim" });
    expect(logSocketError).toHaveBeenCalledExactlyOnceWith(mockSocket, new Error("Invalid auth"));
  });

  it("should rejoin an existing active game for the user", async () => {
    const activeGuess = (await getGames()).find(
      (g) => g.type === "guess" && g.status === "active",
    )!;
    await socketJoinAsPlayer(mockSocket, mockServer)({ auth, payload: "table:guess" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledExactlyOnceWith("gameJoined", activeGuess.gameId);
  });

  it("should seat the first player at a fresh table", async () => {
    await socketJoinAsPlayer(mockSocket, mockServer)({ auth, payload: "table:nim" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith("gameJoined", expect.any(String));
  });

  it("should start the game once the table fills", async () => {
    // user1 seats first, creating and reserving the table's game.
    await socketJoinAsPlayer(mockSocket, mockServer)({ auth, payload: "table:nim" });
    vi.resetAllMocks();
    mockSocket.rooms.clear();

    // user2 joins the same table, filling it (nim seats two) and starting it.
    await socketJoinAsPlayer(mockSocket, mockServer)({ auth: auth2, payload: "table:nim" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith("gameJoined", expect.any(String));
    expect(mockServer.emit).toHaveBeenCalledWith("gamePlayersUpdated", expect.any(Array));
    expect(mockServer.emit).toHaveBeenCalledWith("gameStateUpdated", expect.anything());
  });

  it("should seat a player in a waiting table game without starting it", async () => {
    const user1 = await record("user1");
    const bidder = await record("auctioneer");
    const game = await createGame(user1, "guess", new Date());
    await setTableGame("table:guess", game.gameId);

    // guess has no player cap, so another player joins without the game starting.
    await socketJoinAsPlayer(
      mockSocket,
      mockServer,
    )({ auth: auctioneerAuth, payload: "table:guess" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith("gameJoined", game.gameId);
    expect(mockSocket.join).toHaveBeenCalledWith(`${game.gameId}-${bidder.userId}`);
    expect(mockServer.emit).not.toHaveBeenCalledWith("gameStateUpdated", expect.anything());
  });

  it("should not rejoin the user room when already a member of it", async () => {
    const user1 = await record("user1");
    const bidder = await record("auctioneer");
    const game = await createGame(user1, "guess", new Date());
    await setTableGame("table:guess", game.gameId);
    mockSocket.rooms.add(`${game.gameId}-${bidder.userId}`);

    await socketJoinAsPlayer(
      mockSocket,
      mockServer,
    )({ auth: auctioneerAuth, payload: "table:guess" });
    expect(logSocketError).not.toHaveBeenCalled();
    expect(mockSocket.join).not.toHaveBeenCalled();
  });

  it("should create a fresh game when the table's game already started", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const started = await createGame(user1, "nim", new Date());
    await joinGame(started.gameId, user2);
    await startGame(started.gameId, user1);
    await setTableGame("table:nim", started.gameId);

    await socketJoinAsPlayer(mockSocket, mockServer)({ auth: auth3, payload: "table:nim" });
    expect(logSocketError).not.toHaveBeenCalled();
    // A brand new game is created for the joining player, not the started one.
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "gameJoined",
      expect.not.stringMatching(started.gameId),
    );
  });

  it("should surface an unexpected error when the reserved game is full", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    // The table's reserved game is already full (two players) but still waiting,
    // so a third player's join throws something other than "already in".
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await setTableGame("table:nim", game.gameId);

    await socketJoinAsPlayer(mockSocket, mockServer)({ auth: auth3, payload: "table:nim" });
    expect(logSocketError).toHaveBeenCalledOnce();
  });
});
