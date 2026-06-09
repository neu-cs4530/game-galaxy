import { useEffect, useState } from "react";
import useLoginContext from "./useLoginContext.ts";
import type { SafeUserInfo } from "@gamenite/shared";
import useAuth from "./useAuth.ts";

/**
 * Custom hook to manage the socket connection for the players present in a
 * lobby. Joining and leaving is broadcast over websockets so that avatars
 * appear and disappear for everyone in real time. The server sends the full
 * player list on every change to avoid duplicate avatars accumilating.
 * @returns an object containing all players in lobby
 */
export default function useSocketsForLobbyPlayers(lobbyId: string) {
  const auth = useAuth();
  const { socket } = useLoginContext();
  const [players, setPlayers] = useState<SafeUserInfo[]>([]);

  useEffect(() => {
    const handlePlayersUpdated = (updatedPlayers: SafeUserInfo[]) => {
      setPlayers(updatedPlayers);
    };

    socket.on("lobbyPlayersUpdated", handlePlayersUpdated);
    socket.emit("lobbyJoin", { auth, payload: lobbyId });

    return () => {
      socket.off("lobbyPlayersUpdated", handlePlayersUpdated);
      socket.emit("lobbyLeave", { auth, payload: lobbyId });
    };
  }, [socket, auth, lobbyId]);

  return { players };
}
