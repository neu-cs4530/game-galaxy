import type { ErrorMsg, GameInfo, GameKey, UserAuth } from "@gamegalaxy/shared";
import { api } from "@gamegalaxy/client/src/services/api.ts";

const GAME_API_URL = `/api/game`;

/**
 * Sends a POST request to create a game
 */
export const createGame = async (auth: UserAuth, gameKey: GameKey): Promise<GameInfo> => {
  const res = await api.post<GameInfo | ErrorMsg>(`${GAME_API_URL}/create`, {
    auth,
    payload: gameKey,
  });
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a GET request to get a game
 */
export const getGameById = async (gameId: string): Promise<GameInfo> => {
  const res = await api.get<GameInfo | ErrorMsg>(`${GAME_API_URL}/${gameId}`);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};

/**
 * Sends a GET request for all games
 */
export const gameList = async (): Promise<GameInfo[]> => {
  const res = await api.get<GameInfo[] | ErrorMsg>(`${GAME_API_URL}/list`);
  if ("error" in res.data) throw new Error(res.data.error);
  return res.data;
};
