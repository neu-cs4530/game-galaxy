import { withAuth, type SafeUserInfo } from "@gamenite/shared";
import { z } from "zod";
import { type GameServer, type GameServerSocket, type SocketAPI } from "../types.ts";
import { populateSafeUserInfo } from "../services/user.service.ts";
import { logSocketError } from "./socket.controller.ts";
import { enforceAuth } from "../services/auth.service.ts";
import { TableRepo } from "../repository.ts";
import { getGameById } from "../services/game.service.ts";

/**
 * The socket.io room used to broadcast lobby presence.
 */
const LOBBY_ROOM = "lobby:presence";

/**
 * Who is currently present in the lobby, keyed by socket id. Presence is
 * not stored in the database. Insertion order is preserved so every client sees the players in
 * the same order they joined.
 */
const lobbyPresence = new Map<string, SafeUserInfo>();

/**
 * Send everyone in the lobby the full, list of players currently
 * present.
 */
function broadcastPlayers(io: GameServer): void {
  io.to(LOBBY_ROOM).emit("lobbyPlayersUpdated", [...lobbyPresence.values()]);
}

/**
 * Send everyone in the lobby the players seated at each table. Once the game starts the seats clear.
 */
export async function broadcastTables(io: GameServer): Promise<void> {
  const tableIds = await TableRepo.getAllKeys();
  const tables = await Promise.all(
    tableIds.map(async (tableId) => {
      const table = await TableRepo.get(tableId);
      const game = table.currentGame ? await getGameById(table.currentGame) : null;
      const players = game?.status === "waiting" ? game.players : [];
      return { tableId, players };
    }),
  );
  io.to(LOBBY_ROOM).emit("lobbyTablesUpdated", tables);
}

/** Record a user's presence in the lobby and broadcast the updated list. */
export const socketJoin: SocketAPI = (socket, io) => async (body) => {
  try {
    const { auth } = withAuth(z.string()).parse(body);
    const user = await enforceAuth(auth);
    await socket.join(LOBBY_ROOM);
    lobbyPresence.set(socket.id, await populateSafeUserInfo(user.userId));
    broadcastPlayers(io);
    await broadcastTables(io);
  } catch (err) {
    logSocketError(socket, err);
  }
};

/** Drop a user's presence from the lobby and broadcast the updated list. */
export const socketLeave: SocketAPI = (socket, io) => async () => {
  await socket.leave(LOBBY_ROOM);
  if (lobbyPresence.delete(socket.id)) broadcastPlayers(io);
};

/** Clean up a disconnecting socket's presence, notifying everyone still present. */
export function handleDisconnect(io: GameServer, socket: GameServerSocket): void {
  if (lobbyPresence.delete(socket.id)) broadcastPlayers(io);
}
