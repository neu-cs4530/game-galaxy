import { useEffect, useState } from "react";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import type { LobbyTablePlayers, SafeUserInfo } from "@gamegalaxy/shared";
import useAuth from "@gamegalaxy/client/src/hooks/useAuth.ts";

/**
 * Custom hook to manage the socket connection for the players present in a
 * lobby. Joining and leaving is broadcast over websockets so that avatars
 * appear and disappear for everyone in real time. The server sends the full
 * player list on every change to avoid duplicate avatars accumilating.
 * @returns an object containing
 * - `players`: all players idling in the lobby
 * - `tablePlayers`: all players waiting for a game
 * - `roomPlayers`: players in each room
 */
export default function useSocketsForLobbyPlayers(lobbyId: string) {
  const auth = useAuth();
  const { socket } = useLoginContext();
  const [players, setPlayers] = useState<SafeUserInfo[]>([]);
  const [tablePlayers, setTablePlayers] = useState<LobbyTablePlayers[]>([]);
  const [roomPlayers, setRoomPlayers] = useState<Record<string, SafeUserInfo[]>>({});

  useEffect(() => {
    const handlePlayersUpdated = (updatedPlayers: SafeUserInfo[]) => {
      setPlayers(updatedPlayers);
    };

    const handleTablesUpdated = (updatedTables: LobbyTablePlayers[]) => {
      setTablePlayers(updatedTables);
    };

    const handleRoomsUpdated = (updatedRooms: Record<string, SafeUserInfo[]>) => {
      setRoomPlayers(updatedRooms);
    };

    socket.on("lobbyPlayersUpdated", handlePlayersUpdated);
    socket.on("lobbyTablesUpdated", handleTablesUpdated);
    socket.on("roomPresenceUpdated", handleRoomsUpdated);
    socket.emit("lobbyJoin", { auth, payload: lobbyId });

    return () => {
      socket.off("lobbyPlayersUpdated", handlePlayersUpdated);
      socket.off("lobbyTablesUpdated", handleTablesUpdated);
      socket.off("roomPresenceUpdated", handleRoomsUpdated);
      socket.emit("lobbyLeave", { auth, payload: lobbyId });
    };
  }, [socket, auth, lobbyId]);

  return { players, tablePlayers, roomPlayers };
}
