import { type SafeUserInfo } from "./user.types.ts";

/**
 * The players seated at a lobby table while its game is still in the waiting room.
 * - `tableId`: which table the players are seated at
 * - `players`: the seated users, ordered by the order they joined
 */
export interface LobbyTablePlayers {
  tableId: string;
  players: SafeUserInfo[];
}
