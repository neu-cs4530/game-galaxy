import { type GameInfo, type GameKey, type TaggedGameView } from "@gamenite/shared";
import { createChat } from "./chat.service.ts";
import { populateSafeUserInfo } from "./user.service.ts";
import { type GameServicer } from "../games/gameServiceManager.ts";
import { nimGameService } from "../games/nim.ts";
import { guessGameService } from "../games/guess.ts";
import { type GameViewUpdates, type UserWithId } from "../types.ts";
import { GameRepo } from "../repository.ts";
import { mahjongGameService } from "../games/mahjong/mahjong.ts";
import { getBotMove as mahjongBotMove } from "../games/mahjong/mahjongBot.ts";
import type { MahjongState } from "@gamenite/shared/src/games/mahjong.types.ts";

/**
 * The service interface for individual games
 */
export const gameServices: { [key in GameKey]: GameServicer } = {
  nim: nimGameService,
  guess: guessGameService,
  mahjong: mahjongGameService,
};

/**
 * Run bot moves after a state change until no bot needs to act.
 * Bot player IDs start with "bot:" — no user accounts or DB lookups needed.
 * Calls updateGameRaw directly to avoid circular recursion.
 *
 * @param gameId - the game to advance
 * @param views - the view updates from the triggering move
 * @returns the view updates from the final bot move, or the original views if no bots acted
 */
async function runBotLoop(gameId: string, views: GameViewUpdates): Promise<GameViewUpdates> {
  let currentViews = views;
  let madeMove = true;

  while (madeMove) {
    madeMove = false;
    const game = await GameRepo.find(gameId);
    if (!game?.state || game.done || game.type !== "mahjong") break;

    const botIndices = game.players
      .map((id, i) => ({ id, i }))
      .filter(({ id }) => id.startsWith("bot:"))
      .map(({ i }) => i);

    for (const botIndex of botIndices) {
      const move = mahjongBotMove(game.state as MahjongState, botIndex);
      if (!move) continue;

      const botUser: UserWithId = {
        userId: game.players[botIndex],
        username: game.players[botIndex],
      };
      currentViews = await updateGameRaw(gameId, botUser, move);
      madeMove = true;
      break;
    }
  }

  return currentViews;
}

/**
 * Expand a stored game
 *
 * @param gameId - Valid game id
 * @returns the expanded game info object
 */
async function populateGameInfo(gameId: string): Promise<GameInfo> {
  const game = await GameRepo.get(gameId);
  return {
    gameId,
    createdBy: await populateSafeUserInfo(game.createdBy),
    chat: game.chat,
    createdAt: new Date(game.createdAt),
    players: await Promise.all(game.players.map(populateSafeUserInfo)),
    type: game.type,
    status: !game.state ? "waiting" : game.done ? "done" : "active",
    minPlayers: gameServices[game.type].minPlayers,
  };
}

/**
 * Create and store a new game
 *
 * @param user - Initial player in the game's waiting room
 * @param type - Game key
 * @param createdAt - Creation time for this game
 * @returns the new game's info object
 */
export async function createGame(
  user: UserWithId,
  type: GameKey,
  createdAt: Date,
): Promise<GameInfo> {
  const chat = await createChat(createdAt);
  const gameId = await GameRepo.add({
    type,
    done: false,
    chat: chat.chatId,
    createdAt: createdAt.toISOString(),
    createdBy: user.userId,
    players: [user.userId],
  });
  return populateGameInfo(gameId);
}

/**
 * Retrieves a single game from the database. If you expect the id to be valid, use `forceGameById`.
 *
 * @param gameId - Ostensible game id
 * @returns the game's info object, or null
 */
export async function getGameById(gameId: string): Promise<GameInfo | null> {
  const game = await GameRepo.find(gameId);
  if (!game) return null;
  return populateGameInfo(gameId);
}

/**
 * Adds a user to a game that hasn't started yet.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the game's info object, with the `user` listed among the players
 * @throws if the game id is not valid, if the game has started, or if the game cannot accept more
 * players
 */
export async function joinGame(gameId: string, user: UserWithId): Promise<GameInfo> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} joining invalid game`);
  if (game.state) {
    throw new Error(`user ${user.username} joining game that started`);
  }
  if (game.players.some((userId) => userId === user.userId)) {
    throw new Error(`user ${user.username} joining game they are in already`);
  }
  if (game.players.length === gameServices[game.type].maxPlayers) {
    throw new Error(`user ${user.username} joining full`);
  }

  game.players = [...game.players, user.userId];
  await GameRepo.set(gameId, game);

  return populateGameInfo(gameId);
}

/**
 * Add a bot player to a waiting game.
 * Pushes a "bot:N" placeholder ID onto game.players — no user account needed.
 *
 * @param gameId - the game to add a bot to
 * @returns the updated game info
 * @throws if the game is invalid, already started, or full
 */
export async function addBotToGame(gameId: string): Promise<GameInfo> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error("Invalid game id");
  if (game.state) throw new Error("Game has already started");
  const max = gameServices[game.type].maxPlayers;
  if (max === null) {
    throw new Error("game must have at least one player");
  }
  if (game.players.length >= max) {
    throw new Error("Game is full");
  }

  // count existing bots to generate a unique placeholder id
  const botCount = game.players.filter((id) => id.startsWith("bot:")).length;
  game.players = [...game.players, `bot:${botCount}`];
  await GameRepo.set(gameId, game);
  return populateGameInfo(gameId);
}

/**
 * Initializes a game that hasn't started yet (internal — no bot loop).
 */
async function startGameRaw(gameId: string, user: UserWithId): Promise<GameViewUpdates> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} starting invalid game`);
  if (game.state) throw new Error(`user ${user.username} starting game that started`);
  if (game.players.length < gameServices[game.type].minPlayers) {
    throw new Error(`user ${user.username} starting underpopulated game`);
  }
  if (!game.players.some((userId) => userId === user.userId)) {
    throw new Error(`user ${user.username} starting game they're not in`);
  }

  const { state, views } = gameServices[game.type].create(game.players);
  game.state = state;
  await GameRepo.set(gameId, game);
  return views;
}

/**
 * Initializes a game that hasn't started yet, then runs any pending bot moves.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns the necessary views after bots act
 */
export async function startGame(gameId: string, user: UserWithId): Promise<GameViewUpdates> {
  const views = await startGameRaw(gameId, user);
  return runBotLoop(gameId, views);
}

/**
 * Get a list of all games
 *
 * @returns a list of game summaries, ordered reverse chronologically
 */
export async function getGames(): Promise<GameInfo[]> {
  const keys = await GameRepo.getAllKeys();
  const unsorted = await Promise.all(keys.map(populateGameInfo));
  return unsorted.toSorted((game1, game2) => game2.createdAt.getTime() - game1.createdAt.getTime());
}

/**
 * Updates a game state (internal — no bot loop).
 */
async function updateGameRaw(
  gameId: string,
  user: UserWithId,
  move: unknown,
): Promise<GameViewUpdates> {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} acted on an invalid game`);
  if (!game.state) throw new Error(`user ${user.username} made a move in game that hadn't started`);

  const playerIndex = game.players.findIndex((userId) => userId === user.userId);
  if (playerIndex < 0)
    throw new Error(`user ${user.username} made a move in a game they weren't playing`);

  const result = gameServices[game.type].update(game.state, move, playerIndex, game.players);
  if (!result) throw new Error(`user ${user.username} made an invalid move in ${game.type}`);

  game.state = result.state;
  game.done = game.done || result.done;
  await GameRepo.set(gameId, game);
  return result.views;
}

/**
 * Updates a game state and returns view updates after all bots have acted.
 *
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @param move - Unsanitized game move
 * @returns the view updates after the player's move and all subsequent bot moves
 */
export async function updateGame(
  gameId: string,
  user: UserWithId,
  move: unknown,
): Promise<GameViewUpdates> {
  const views = await updateGameRaw(gameId, user, move);
  return runBotLoop(gameId, views);
}

/**
 * View a game as a specific user
 * @param gameId - Ostensible game id
 * @param user - Authenticated user
 * @returns A boolean for whether that user is a player, the player's view, and the list of players
 */
export async function viewGame(gameId: string, user: UserWithId) {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`user ${user.username} viewed an invalid game id`);
  const playerIndex = game.players.findIndex((userId) => userId === user.userId);
  let view: TaggedGameView | null = null;
  if (game.state) {
    view = gameServices[game.type].view(game.state, playerIndex);
  }
  return {
    isPlayer: playerIndex >= 0,
    view,
    players: await Promise.all(game.players.map(populateSafeUserInfo)),
  };
}

/**
 * Find an in-progress game that the given user is playing if one exists
 * @param userId - the user for which the game needs to be found
 * @param gameType - the type of game which needs to be found
 * @returns the gameID if a game exists, null otherwise.
 */
export async function findActiveGameForUser(
  userId: string,
  gameType: GameKey,
): Promise<string | null> {
  const keys = await GameRepo.getAllKeys();
  for (const key of keys) {
    const game = await GameRepo.get(key);
    if (game.type === gameType && game.state && !game.done && game.players.includes(userId)) {
      return key;
    }
  }
  return null;
}
