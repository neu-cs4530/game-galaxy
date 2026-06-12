import { type GameInfo, withAuth, zGameKey, zGameMakeMovePayload } from "@gamenite/shared";
import { type RestAPI, type GameViewUpdates, type SocketAPI, type GameServer } from "../types.ts";
import {
  addBotToGame,
  createGame,
  findActiveGameForUser,
  gameServices,
  getGameById,
  getGames,
  joinGame,
  startGame,
  updateGame,
  viewGame,
} from "../services/game.service.ts";
import { z } from "zod";
import { logSocketError } from "./socket.controller.ts";
import { checkAuth, enforceAuth } from "../services/auth.service.ts";
import { GameRepo, TableRepo, UserRepo } from "../repository.ts";
import { updateCoinCount } from "../services/user.service.ts";
import { clearTableGame, setTableGame } from "../services/table.service.ts";
import { broadcastTables } from "./lobby.controller.ts";

/**
 * Handle POST requests to `/api/game/create` by creating a game. The game
 * starts with one player, the user who made the POST request.
 */
export const postCreate: RestAPI<GameInfo> = async (req, res) => {
  const body = withAuth(zGameKey).safeParse(req.body);
  if (body.error) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  const user = await checkAuth(body.data.auth);
  if (!user) {
    res.status(403).send({ error: "Invalid credentials" });
    return;
  }

  const game = await createGame(user, body.data.payload, new Date());
  res.send(game);
};

/**
 * Handle GET requests to `/api/game/:id`. Returns either 404 or a game info
 * object.
 */
export const getById: RestAPI<GameInfo, { id: string }> = async (req, res) => {
  const game = await getGameById(req.params.id);
  if (!game) {
    res.status(404).send({ error: "Game not found" });
    return;
  }

  res.send(game);
};

/**
 * Handle GET requests to `/api/game/list` by returning information about all
 * games, sorted in reverse chronological order by creation.
 */
export const getList: RestAPI<GameInfo[]> = async (req, res) => {
  res.send(await getGames());
};

/**
 * Each active game player gets a dedicated room that sends messages
 * to just their socket connections. This function derives that room name from
 * the game id and the username.
 *
 * @param gameId - the game id, also the 'base' room name
 * @param userId - user id (not username!)
 * @returns a room name unique to that game id and user
 */
function userRoom(gameId: string, user: string) {
  return `${gameId}-${user}`;
}

/**
 * Handle the socket request sent by a user when they load to a game page. The
 * server's job is to respond with full information about the game's current
 * players and the appropriate view of the game's state. The server also needs
 * to register the user for future updates about the game's state.
 */
export const socketWatch: SocketAPI = (socket) => async (body) => {
  try {
    const { auth, payload: gameId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    const { isPlayer, view, players } = await viewGame(gameId, user);
    const roomsToJoin = isPlayer ? [gameId, userRoom(gameId, user.userId)] : [gameId];
    await socket.join(roomsToJoin);
    socket.emit("gameWatched", { gameId, view, players });
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Broadcast view updates to appropriate users
 */
function sendViewUpdates(io: GameServer, gameId: string, updates: GameViewUpdates) {
  io.to(gameId).emit("gameStateUpdated", { ...updates.watchers, forPlayer: false });
  for (const { userId, view } of updates.players) {
    io.to(userRoom(gameId, userId)).emit("gameStateUpdated", { ...view, forPlayer: true });
  }
}

/**
 * Handle the socket request sent by a user when they try to join a game.
 */
export const socketJoinAsPlayer: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth, payload: tableId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    const table = await TableRepo.get(tableId);
    const existingGameId = await findActiveGameForUser(user.userId, table.gameType);
    if (existingGameId) {
      socket.emit("gameJoined", existingGameId);
      return;
    }
    // Reuse the table's current game only if it's still in the waiting room.
    // If it has already started (or finished), the table is effectively free,
    // so make a fresh game for the joining player.
    const currentGame = table.currentGame ? await getGameById(table.currentGame) : null;
    let gameId: string;
    if (!currentGame || currentGame.status !== "waiting") {
      const game = await createGame(user, table.gameType, new Date());
      gameId = game.gameId;
      await setTableGame(tableId, gameId);
    } else {
      gameId = currentGame.gameId;
    }
    let game;
    try {
      game = await joinGame(gameId, user);
    } catch (err) {
      if (`${err}`.includes("joining game they are in already")) {
        socket.emit("gameJoined", gameId);
        await broadcastTables(io);
        return;
      }
      throw err;
    }
    socket.emit("gameJoined", gameId);

    // Let everyone know the user joined (`io` instead of `socket` includes
    // the joiner)
    io.to(gameId).emit("gamePlayersUpdated", game.players);

    // This socket should receive user-specific updates for this game, if it
    // isn't already
    if (!socket.rooms.has(userRoom(gameId, user.userId))) {
      await socket.join(userRoom(gameId, user.userId));
    }

    // If the game is full, it starts automatically
    if (game.players.length === gameServices[game.type].maxPlayers) {
      await clearTableGame(tableId);
      sendViewUpdates(io, gameId, await startGame(gameId, user));
    }
    await broadcastTables(io);
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a request to start the game.
 */
export const socketStart: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth, payload: gameId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    const game = await GameRepo.get(gameId);
    if (game.table) {
      await clearTableGame(game.table);
    }
    sendViewUpdates(io, gameId, await startGame(gameId, user));
    await broadcastTables(io);
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a request to make a move in a game.
 */
export const socketMakeMove: SocketAPI = (socket, io) => async (body) => {
  try {
    const {
      auth,
      payload: { gameId, move },
    } = withAuth(zGameMakeMovePayload).parse(body);
    const user = await enforceAuth(auth);
    const viewUpdates = await updateGame(gameId, user, move);
    sendViewUpdates(io, gameId, viewUpdates);
    await rewardWins(gameId, io);
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * Handle a request to add a bot player to a waiting game.
 * The requesting user must already be in the game.
 * Auto-starts the game if adding the bot fills the last seat.
 */
export const socketAddBot: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth, payload: gameId } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);

    const gameRecord = await GameRepo.get(gameId);
    if (!gameRecord.players.includes(user.userId)) {
      throw new Error(`user ${user.username} tried to add a bot to a game they are not in`);
    }

    const game = await addBotToGame(gameId);
    io.to(gameId).emit("gamePlayersUpdated", game.players);

    // auto-start if adding the bot filled the last seat
    if (game.players.length === gameServices[game.type].maxPlayers) {
      sendViewUpdates(io, gameId, await startGame(gameId, user));
    }
  } catch (err) {
    logSocketError(socket, err);
  }
};

/**
 * If game is over, update winner balances and inform clients of the update.
 *
 * @param gameId the identifier for this game instance
 * @param io the socket game server
 */
async function rewardWins(gameId: string, io: GameServer) {
  const game = await GameRepo.find(gameId);
  if (!game) throw new Error(`Invalid game ${gameId}`);
  if (game.done) {
    const winnerIndices = gameServices[game.type].getWinners(game.state);
    const winnerIds = winnerIndices.map((i) => game.players[i]);
    for (const winnerId of winnerIds) {
      const user = await UserRepo.find(winnerId);
      if (!user) throw new Error(`Invalid user ${winnerId}`);
      const newBalance = await updateCoinCount(winnerId, 10);
      io.to(userRoom(gameId, winnerId)).emit("balanceUpdated", { balance: newBalance });
    }
  }
}
