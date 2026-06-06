import useLoginContext from "../hooks/useLoginContext";
import useAuth from "../hooks/useAuth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface GameTableProps {
  sprite: string;
  top: string;
  left: string;
  width: string;
  height: string;
  tableId: string;
}

/**
 * represents a table through which a user can join a game.
 * @param sprite - the image to be rendered for the table
 * @param top - the y coordinate of the top left of the sprite, as a % of the total img size
 * @param left - the x coordinate of the top left of the sprite, as a % of the total img size
 * @param width - the width of the sprite, as a % of the total img size
 * @param height - the height of the sprite, as a % of the total img size
 * @param tableId - the unique id of this table connecting it to the game which it links to.
 */
export default function GameTable({ sprite, top, left, width, height, tableId }: GameTableProps) {
  const { socket } = useLoginContext();
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleGameJoined = (gameId: string) => {
      void navigate(`/game/${gameId}`);
    };
    socket.on("gameJoined", handleGameJoined);
    return () => {
      socket.off("gameJoined", handleGameJoined);
    };
  }, [socket, navigate]);

  function handleClick() {
    socket.emit("gameJoinAsPlayer", { auth, payload: tableId });
  }

  return (
    <img
      data-testid={`table-${tableId}`}
      src={sprite}
      style={{ position: "absolute", top, left, width, height, cursor: "pointer" }}
      onClick={handleClick}
    />
  );
}
