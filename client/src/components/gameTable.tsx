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
    console.log("clicked", tableId);
    console.log("socket connected:", socket.connected);
    socket.emit("gameJoinAsPlayer", { auth, payload: tableId });
    console.log("emitted", tableId);
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
