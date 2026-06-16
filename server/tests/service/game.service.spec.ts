import { describe, it, expect } from "vitest";
import { getUserByUsername } from "../../src/services/auth.service.ts";
import {
  createGame,
  joinGame,
  startGame,
  updateGame,
  addBotToGame,
} from "../../src/services/game.service.ts";

async function record(username: string) {
  return (await getUserByUsername(username))!;
}

describe("game.service — startGame error paths", () => {
  it("should throw when starting an invalid game id", async () => {
    const user1 = await record("user1");
    await expect(startGame("nonexistent-id", user1)).rejects.toThrow();
  });

  it("should throw when starting a game that already started", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);
    await expect(startGame(game.gameId, user1)).rejects.toThrow("started");
  });

  it("should throw when starting with too few players", async () => {
    const user1 = await record("user1");
    const game = await createGame(user1, "nim", new Date());
    await expect(startGame(game.gameId, user1)).rejects.toThrow("underpopulated");
  });

  it("should throw when a non-player tries to start the game", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const user3 = await record("user3");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await expect(startGame(game.gameId, user3)).rejects.toThrow("not in");
  });
});

describe("game.service — updateGame error paths", () => {
  it("should throw when acting on an invalid game id", async () => {
    const user1 = await record("user1");
    await expect(updateGame("nonexistent-id", user1, {})).rejects.toThrow();
  });

  it("should throw when making a move in a game that hasn't started", async () => {
    const user1 = await record("user1");
    const game = await createGame(user1, "nim", new Date());
    await expect(updateGame(game.gameId, user1, {})).rejects.toThrow("hadn't started");
  });

  it("should throw when a non-player makes a move", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const user3 = await record("user3");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);
    await expect(updateGame(game.gameId, user3, {})).rejects.toThrow("weren't playing");
  });

  it("should throw on an invalid move", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);
    await expect(updateGame(game.gameId, user1, { type: "invalid" })).rejects.toThrow();
  });
});

describe("game.service — addBotToGame error paths", () => {
  it("should throw when adding a bot to an invalid game id", async () => {
    await expect(addBotToGame("nonexistent-id")).rejects.toThrow("Invalid game id");
  });

  it("should throw when adding a bot to a game that has already started", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await startGame(game.gameId, user1);
    await expect(addBotToGame(game.gameId)).rejects.toThrow("already started");
  });

  it("should throw when adding a bot to a full game", async () => {
    const user1 = await record("user1");
    const user2 = await record("user2");
    const game = await createGame(user1, "nim", new Date());
    await joinGame(game.gameId, user2);
    await expect(addBotToGame(game.gameId)).rejects.toThrow("full");
  });
});
