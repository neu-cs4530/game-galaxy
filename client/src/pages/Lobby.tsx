import GameTable from "../components/gameTable";
import LobbyDisplay from "../components/LobbyDisplay";
import RoomLink from "../components/RoomLink";
import useAuth from "../hooks/useAuth";

export default function Lobby() {
  const username = useAuth().username;
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <LobbyDisplay />
      <RoomLink
        sprite="/sprites/lobby/Table1_frame1.png"
        route={`/profile/${username}`}
        top="18%"
        left="20%"
        width="18%"
        height="15%"
      />
      <RoomLink
        sprite="/sprites/lobby/Table1_frame1.png"
        route={`/profile/${username}`}
        top="15%"
        left="30.6%"
        width="18%"
        height="15%"
      />
      <RoomLink
        sprite="/sprites/lobby/Table1_frame1.png"
        route="/forum"
        top="20%"
        left="50%"
        width="18%"
        height="15%"
      />
      <GameTable
        sprite="/sprites/lobby/Table1_frame1.png"
        top="31%"
        left="30.0%"
        width="25%"
        height="20%"
        tableId="table:nim"
      />
      <GameTable
        sprite="/sprites/lobby/Table1_frame1.png"
        top="45%"
        left="56%"
        width="25%"
        height="20%"
        tableId="table:guess"
      />
    </div>
  );
}
