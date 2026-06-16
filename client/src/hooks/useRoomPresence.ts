import { useEffect } from "react";
import useLoginContext from "@gamegalaxy/client/src/hooks/useLoginContext.ts";
import useAuth from "@gamegalaxy/client/src/hooks/useAuth.ts";

/**
 * Announce that the user is in a specific room, and move their avatar in the lobby
 * accordingly
 */
export default function useRoomPresence(roomId: string) {
  const auth = useAuth();
  const { socket } = useLoginContext();

  useEffect(() => {
    socket.emit("roomJoin", { auth, payload: roomId });

    return () => {
      socket.emit("roomLeave", { auth, payload: roomId });
    };
  }, [socket, auth, roomId]);
}
